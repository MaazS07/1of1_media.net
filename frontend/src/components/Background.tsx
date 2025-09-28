import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Grid } from '@react-three/drei';
import * as random from 'maath/random';
import * as THREE from 'three';

function Stars() {
  const ref = useRef<any>(null);
  // Cast the result of inSphere to Float32Array
  const sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 }) as Float32Array;

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#F0E100"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function AnimatedCubes() {
  const groupRef = useRef<THREE.Group | null>(null);
  const cubes = new Array(8).fill(null);
  
  // Generate random colors for each cube
  const colors = useMemo(() => 
    cubes.map(() => new THREE.Color(
      Math.random() * 0.5 + 0.5, // r
      Math.random() * 0.5 + 0.5, // g
      Math.random() * 0.5 + 0.5  // b
    )),
  []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.children.forEach((cube, i) => {
        cube.position.y = Math.sin(state.clock.elapsedTime + i) * 0.1;
        cube.rotation.x += 0.01;
        cube.rotation.z += 0.01;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {cubes.map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / cubes.length) * Math.PI * 2) * 2,
            0,
            Math.sin((i / cubes.length) * Math.PI * 2) * 2,
          ]}
          scale={0.1}
        >
          <boxGeometry />
          <meshPhongMaterial
            color={colors[i]}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Stars />
      <AnimatedCubes />
      <Grid
        position={[0, -2, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#F0E100"
        sectionSize={2}
        fadeDistance={30}
        fadeStrength={1}
      />
    </>
  );
}

export function Background() {
  return (
    <div className="fixed inset-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ antialias: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}