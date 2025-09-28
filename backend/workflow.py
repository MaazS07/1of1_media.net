from typing import Dict, Iterator, Optional
from textwrap import dedent
from agno.workflow import Workflow
from agno.run.workflow import RunOutput
from pydantic import BaseModel, Field
from agent import CSVAgent, EmailAgent, TextAgent
from agno.db.sqlite import SqliteDb
from agno.utils.log import logger
# from agno.utils.pprint import pprint_run_response  # May need updating for v2.0
import time
import os
from fastapi import UploadFile

class CustomerData(BaseModel):
    name: str = Field(..., description="Customer's name")
    email: str = Field(..., description="Customer's email address")
    description: str = Field(..., description="Personal description of the customer")

class MarketingEmailWorkflow(Workflow):
    """Workflow for sending personalized marketing emails to customers based on CSV data."""

    description: str = dedent("""
    An intelligent marketing email workflow that processes customer data from a CSV file
    and sends personalized marketing emails. The workflow combines data processing with
    personalized content generation to create targeted marketing campaigns.
    """)

    def __init__(
        self,
        session_id: str,
        file: UploadFile,
        sender_email: str,
        sender_name: str,
        sender_passkey: str,
        model: str = "groq",
        *args,
        **kwargs
    ):
        super().__init__(session_id=session_id, *args, **kwargs)
        self.file = file
        self.sender_email = sender_email
        self.sender_name = sender_name
        self.sender_passkey = sender_passkey
        self.model = model
        
        # Initialize session state if not already present
        if not hasattr(self, 'session_state') or self.session_state is None:
            self.session_state = {}

        # Read the file content once
        try:
            self.file_content = self.file.file.read().decode("utf-8")
            # Reset file pointer after reading
            self.file.file.seek(0)
        except Exception as e:
            logger.error(f"Error reading file content: {str(e)}")
            self.file_content = None
        
        # Initialize CSV Agent with the file content
        self.csv_agent = CSVAgent(model=self.model, file=self.file)

    def run(
        self,
        company_name: str,
        product_description: str,
        use_cached_results: bool = True,
        max_retries: int = 3,
        retry_delay: int = 5
    ) -> Iterator[RunOutput]:
        logger.info(f"Starting marketing email campaign for {company_name}")

        # Input validation
        if not company_name or not product_description:
            raise ValueError("Company name and product description are required")

        # Check cache for previously sent emails
        if use_cached_results:
            cached_results = self.get_cached_results(company_name)
            if cached_results:
                yield RunOutput(
                    content=cached_results
                )
                return

        try:
            # Use direct CSV parsing as primary method to avoid CSV agent issues
            logger.info("Using direct CSV parsing for reliable data extraction")
            csv_response = self.format_csv_as_markdown_table()
            
            if not csv_response or len(csv_response.strip()) == 0:
                # Fallback to CSV agent if direct parsing fails
                logger.warning("Direct CSV parsing failed, trying CSV agent as fallback")
                customer_query = "SELECT * FROM sample_marketing"
                retry_count = 0
                
                while retry_count < max_retries:
                    try:
                        # Reset the file pointer before each attempt
                        self.file.file.seek(0)
                        csv_response = self.csv_agent.run_agent(customer_query)
                        if csv_response and len(csv_response.strip()) > 0 and "was not found" not in csv_response and "error" not in csv_response.lower():
                            logger.info("CSV agent successfully provided data")
                            break
                        retry_count += 1
                        if retry_count < max_retries:
                            time.sleep(retry_delay)
                    except Exception as e:
                        retry_count += 1
                        logger.warning(f"CSV agent attempt {retry_count} failed: {str(e)}")
                        if retry_count >= max_retries:
                            raise Exception(f"Failed to get CSV data after {max_retries} attempts: {str(e)}")
                        time.sleep(retry_delay)
        
            if not csv_response or len(csv_response.strip()) == 0:
                raise Exception("No customer data could be extracted from CSV file")
                
            # Process each customer and send personalized email with delay between sends
            results = []
            customer_count = 0
            
            parsed_customers = list(self.parse_csv_response(csv_response))
            
            if not parsed_customers:
                yield RunOutput(
                    content=f"No valid customers found in CSV data"
                )
                return
                
            for customer_data in parsed_customers:
                customer_count += 1
                logger.debug(f"Processing customer: {customer_data.email}")

                # Create email content based on customer description
                try:
                    email_content = self.generate_email_content(
                        customer_data,
                        company_name,
                        product_description
                    )
                except Exception as e:
                    logger.error(f"Error generating email content: {str(e)}")
                    continue

                # Initialize EmailAgent for this customer
                try:
                    email_agent = EmailAgent(
                        model=self.model,
                        receiver_email=customer_data.email,
                        sender_email=self.sender_email,
                        sender_name=self.sender_name,
                        sender_passkey=self.sender_passkey
                    )
                except Exception as e:
                    logger.error(f"Error initializing EmailAgent: {str(e)}")
                    results.append({
                        "customer": customer_data.model_dump(),
                        "email_status": "failed",
                        "error": f"Failed to initialize EmailAgent: {str(e)}"
                    })
                    continue

                retry_count = 0
                while retry_count < max_retries:
                    try:
                        # Verify the EmailAgent's receiver is correct before sending
                        if email_agent.receiver_email != customer_data.email:
                            # Recreate the agent with the correct receiver
                            email_agent = EmailAgent(
                                model=self.model,
                                receiver_email=customer_data.email,
                                sender_email=self.sender_email,
                                sender_name=self.sender_name,
                                sender_passkey=self.sender_passkey
                            )
                            
                        logger.debug(f"Sending email to {customer_data.email}, attempt {retry_count+1}")
                        # Send personalized email with exponential backoff
                        email_response = email_agent.run_agent(email_content)
                        logger.debug(f"Email sent to {customer_data.email} with response: {email_response}")
                        results.append({
                            "customer": customer_data.model_dump(),
                            "email_status": "success",
                            "response": email_response
                        })
                        # Add delay between sends with exponential backoff
                        delay_time = retry_delay * (2 ** retry_count)
                        time.sleep(delay_time)
                        break
                    except Exception as e:
                        retry_count += 1
                        logger.warning(f"Attempt {retry_count} failed for {customer_data.email}: {str(e)}")
                        if retry_count < max_retries:
                            delay_time = retry_delay * (2 ** retry_count)
                            time.sleep(delay_time)
                        else:
                            logger.error(f"Failed to send email to {customer_data.email} after {max_retries} attempts")
                            results.append({
                                "customer": customer_data.model_dump(),
                                "email_status": "failed",
                                "error": f"Failed after {max_retries} attempts: {str(e)}"
                            })

            # Cache the results
            self.add_results_to_cache(company_name, results)

            # Return final response
            success_count = sum(1 for r in results if r.get("email_status") == "success")
            yield RunOutput(
                content=f"Successfully sent {success_count} of {len(results)} personalized marketing emails"
            )

        except Exception as e:
            logger.error(f"Error in marketing workflow: {str(e)}")
            yield RunOutput(
                content=f"Error: {str(e)}"
            )

    def parse_csv_response(self, csv_response: str) -> Iterator[CustomerData]:
        """Parse the CSV agent response and yield CustomerData objects."""
        try:
            logger.info(f"Parsing CSV response: {csv_response[:200]}...")
            
            # Skip empty responses
            if not csv_response or not csv_response.strip():
                logger.warning("Empty CSV response received")
                return

            # Try to parse as markdown table format first
            lines = [line.strip() for line in csv_response.strip().split('\n') if line.strip()]
            if not lines:
                logger.warning("No valid data found in CSV response")
                return

            # Check if it's a markdown table format
            if any(line.startswith('|') for line in lines):
                logger.info("Detected markdown table format")
                # Find the actual data rows (skip markdown formatting)
                data_rows = []
                for line in lines:
                    # Skip markdown table formatting and empty lines
                    if line.startswith('|') and not line.replace('|', '').replace('-', '').strip() == '':
                        cleaned_line = line.strip('|').strip()
                        if cleaned_line and not cleaned_line.startswith('-'):
                            data_rows.append(cleaned_line)

                if len(data_rows) > 1:
                    # Process each data row (skipping header)
                    for i, row_str in enumerate(data_rows[1:], 1):
                        try:
                            cells = [cell.strip() for cell in row_str.split('|')]
                            if len(cells) >= 3:
                                name = cells[0]
                                email = cells[1]
                                description = cells[2]
                                if '@' in email:
                                    logger.info(f"Found valid customer: {name} ({email})")
                                    yield CustomerData(
                                        name=name,
                                        email=email,
                                        description=description
                                    )
                                else:
                                    logger.warning("Invalid email format in row: %s", row_str)
                            else:
                                logger.warning("Skipping invalid row: %s", row_str)
                        except Exception as e:
                            logger.error("Error processing row '%s': %s", row_str, str(e))
                            continue
            else:
                # Try to parse as direct CSV content or plain text format
                logger.info("Trying to parse as direct CSV content")
                
                # If we have the original file content, parse that directly
                if hasattr(self, 'file_content') and self.file_content:
                    csv_lines = [line.strip() for line in self.file_content.strip().split('\n') if line.strip()]
                    if len(csv_lines) > 1:
                        # Skip header row
                        for line in csv_lines[1:]:
                            try:
                                parts = [part.strip() for part in line.split(',')]
                                if len(parts) >= 3:
                                    name, email, description = parts[0], parts[1], parts[2]
                                    if '@' in email:
                                        logger.info(f"Found valid customer from direct parsing: {name} ({email})")
                                        yield CustomerData(
                                            name=name,
                                            email=email,
                                            description=description
                                        )
                            except Exception as e:
                                logger.error(f"Error parsing CSV line '{line}': {str(e)}")
                                continue
                        
        except Exception as e:
            logger.error("Error parsing CSV response: %s", str(e))
            return

    def generate_email_content(self, customer: CustomerData, company_name: str, product_description: str) -> str:
        """Generate personalized email content using TextAgent based on customer data."""
        
        # Try with primary model first, then fallback
        models_to_try = [self.model, "groq" if self.model != "groq" else "gemini"]
        
        for model_name in models_to_try:
            try:
                # Initialize TextAgent for content generation
                text_agent = TextAgent(
                    model=model_name,
                    instructions="You are an expert marketing copywriter. Generate personalized email content that is engaging, professional, and tailored to the recipient's profile."
                )
                
                # Prepare the prompt for content generation
                prompt = f"""Generate a marketing email with the following details:
        - Recipient's Name: {customer.name}
        - Recipient's Professional Background: {customer.description}
        - Company Name: {company_name}
        - Product/Service Description: {product_description}
        -Sender's Name: {self.sender_name}
        
        The email should:
        1. Have an engaging subject line
        2. Be personalized based on the recipient's background
        3. Highlight how our solutions address their specific needs
        4. Include a clear call to action
        5. Maintain a professional yet friendly tone
        
        Format the email with proper structure including subject line, greeting, body, and signature."""
                
                # Generate personalized content
                email_content = text_agent.run_agent(prompt)
                logger.info(f"Successfully generated email content using {model_name}")
                return email_content
                
            except Exception as e:
                logger.warning(f"Failed to generate email content with {model_name}: {str(e)}")
                continue
        
        # If all models fail, return a basic template
        logger.error("All models failed to generate email content, using fallback template")
        return f"""Subject: Discover {company_name}'s innovative solutions

Dear {customer.name},

I hope this email finds you well. Given your background in {customer.description}, I thought you might be interested in learning about {company_name}'s latest offerings.

{product_description}

I'd love to discuss how our solutions can benefit your work. Would you be available for a brief conversation?

Best regards,
{self.sender_name}"""

    def get_cached_results(self, company_name: str) -> Optional[str]:
        """Retrieve cached results for the company's campaign."""
        if not hasattr(self, 'session_state') or self.session_state is None:
            self.session_state = {}
        return self.session_state.get("email_campaigns", {}).get(company_name)

    def add_results_to_cache(self, company_name: str, results: list):
        """Cache the results of the email campaign."""
        if not hasattr(self, 'session_state') or self.session_state is None:
            self.session_state = {}
        self.session_state.setdefault("email_campaigns", {})
        self.session_state["email_campaigns"][company_name] = results

    def format_csv_as_markdown_table(self) -> str:
        """Format the CSV content as a markdown table for parsing."""
        try:
            if not self.file_content:
                return ""
                
            # Split the content into lines
            lines = [line.strip() for line in self.file_content.strip().split('\n') if line.strip()]
            if not lines:
                return ""
                
            # Get headers from first line
            headers = [h.strip() for h in lines[0].split(',')]
            
            # Build the markdown table
            table = "| " + " | ".join(headers) + " |\n"
            table += "| " + " | ".join(["---"] * len(headers)) + " |\n"
            
            # Add data rows
            for line in lines[1:]:
                values = [val.strip() for val in line.split(',')]
                # Ensure we have the right number of values
                while len(values) < len(headers):
                    values.append("")
                table += "| " + " | ".join(values) + " |\n"
                
            return table
        except Exception as e:
            logger.error(f"Error formatting CSV as table: {str(e)}")
            return ""
