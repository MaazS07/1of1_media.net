// HeroBackground.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LiquidEther from "./LiquidEther";
import CardDeck from "./CardDeck"; // 👈 Import your component

const HeroBackground: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "98vw",
        height: "100vh",
        position: "relative",
        backgroundColor: "#1A1A1A",
        overflow: "hidden",
      }}
    >
      {/* Liquid Ether Background */}
      <LiquidEther
        colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo={true}
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.15}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
      />

      {/* Overlay Flex Layout */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8vw",
          color: "white",
        }}
      >
        {/* Left Side (Text + Button) */}
        <div style={{ textAlign: "left" }}>
          <h1
            style={{
              fontSize: "15vh",
              fontWeight: "700",
              fontFamily: "'Syncopate', sans-serif",
              letterSpacing: "2px",
              margin: 0,
            }}
          >
            Thread
          </h1>
          <h1
            style={{
              fontSize: "15vh",
              fontWeight: "700",
              fontFamily: "'Syncopate', sans-serif",
              letterSpacing: "2px",
              margin: 0,
            }}
          >
            Loom
          </h1>
          <h1
            style={{
              fontSize: "2vh",
              fontWeight: "400",
              fontFamily: " Italics 'Space Grotesk', sans-serif",
              letterSpacing: "2px",
              margin: 0,
            }}
          >
            Build, Deploy, and Scale Your AI Workflows with Drag-and-Drop Simplicity
          </h1>
          <button
            onClick={() => navigate("/playground")}
            style={{
              marginTop: "20px",
              padding: "12px 32px",
              fontSize: "1.2rem",
              fontWeight: "600",
              border: "none",
              borderRadius: "999px",
              background: "linear-gradient(90deg, #FF9FFC 0%, #5227FF 100%)",
              fontFamily: "'Inter', sans-serif",
              color: "white",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 20px rgba(255, 159, 252, 0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            Get Started <span>&#8594;
            </span>
          </button>
        </div>

        {/* Right Side (CardDeck Component) */}
       {/* Right Side (CardDeck Component) */}
<div
  style={{
    flex: 1,
    display: "flex",
    justifyContent: "right",
    alignItems: "right",
    marginLeft: "8rem", // Added margin from left
  }}
>
  <CardDeck />
</div>
      </div>
    </div>
  );
};

export default HeroBackground;
