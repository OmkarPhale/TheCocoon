/**
 * Babylon.js scene factory for the first exploration slice.
 *
 * The caller creates and owns the Babylon Engine; this factory creates one
 * scene attached to that engine and returns the camera/beacon references that
 * the entry point needs for movement and interaction. Keeping the factory
 * deterministic makes the current scene straightforward to replace as the
 * game's setting and art direction become known.
 *
 * Geometry is deliberately procedural placeholder art. The camera uses a
 * lightweight ellipsoid collision setup for grounding and solid scenery; this
 * is not a full rigid-body physics world or a final terrain system.
 */
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import "@babylonjs/core/Collisions/collisionCoordinator";
import { Engine } from "@babylonjs/core/Engines/engine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

export interface GameWorld {
  /** Scene rendered each frame by the Babylon engine's render loop. */
  scene: Scene;
  /** First-person viewpoint moved through the collision-aware camera adapter. */
  camera: FreeCamera;
  /** Temporary objective whose proximity and discovery state drive the UI. */
  beacon: Mesh;
  /** Exposed so the entry point can visibly dim the objective after discovery. */
  beaconMaterial: StandardMaterial;
  /** Three inactive path lights that become visible after Mori remembers home. */
  wayfinderMaterials: StandardMaterial[];
  /** The distant bell's material, lit as the next story objective. */
  bellMaterial: StandardMaterial;
}

export function createWorld(
  engine: Engine,
  canvas: HTMLCanvasElement,
): GameWorld {
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;

  // A soft sky tint and exponential fog keep the small placeholder world
  // bright, colorful, and visually calm without requiring a skybox asset.
  scene.clearColor = new Color4(0.55, 0.79, 0.81, 1);
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogDensity = 0.012;
  scene.fogColor = new Color3(0.55, 0.79, 0.81);

  // The camera is placed at approximate standing eye height and initially
  // looks toward the center of the test space. Babylon handles pointer look;
  // translation keys are disabled because keyboardMovement.ts owns movement.
  const camera = new FreeCamera(
    "player-camera",
    new Vector3(0, 1.7, -12),
    scene,
  );
  camera.setTarget(new Vector3(0, 1.7, 0));
  camera.inertia = 0.78;
  camera.angularSensibility = 3500;
  camera.keysUp = [];
  camera.keysDown = [];
  camera.keysLeft = [];
  camera.keysRight = [];
  camera.ellipsoid = new Vector3(0.45, 0.9, 0.45);
  camera.checkCollisions = true;
  camera.applyGravity = false;
  camera.attachControl(canvas, true);

  // Soft sky fill and warm directional light help simple shapes feel sunny
  // and welcoming without adding expensive post-processing.
  const ambient = new HemisphericLight(
    "ambient-light",
    new Vector3(0.2, 1, 0.1),
    scene,
  );
  ambient.intensity = 0.6;
  ambient.groundColor = new Color3(0.28, 0.38, 0.3);

  const moonlight = new DirectionalLight(
    "moonlight",
    new Vector3(-0.4, -1, 0.3),
    scene,
  );
  moonlight.diffuse = new Color3(1, 0.86, 0.65);
  moonlight.intensity = 0.8;

  // The meadow uses a soft green floor rather than the darker placeholder
  // palette from the first technical rendering test.
  const groundMaterial = new StandardMaterial("ground-material", scene);
  groundMaterial.diffuseColor = new Color3(0.27, 0.48, 0.32);
  groundMaterial.specularColor = new Color3(0.16, 0.22, 0.15);
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100, subdivisions: 2 },
    scene,
  );
  ground.material = groundMaterial;
  ground.checkCollisions = true;

  const pathMaterial = new StandardMaterial("path-material", scene);
  pathMaterial.diffuseColor = new Color3(0.75, 0.66, 0.48);
  pathMaterial.specularColor = new Color3(0.12, 0.12, 0.1);

  // A shallow, collision-aware ramp gives the visible bell a real approach.
  // The mesh is a simple stand-in for a shaped hill until terrain art arrives.
  const hillRamp = MeshBuilder.CreateBox(
    "hilltop-approach-ramp",
    { width: 14, height: 0.35, depth: 16 },
    scene,
  );
  hillRamp.position.set(0, 0.12, 33);
  hillRamp.rotation.x = -0.13;
  hillRamp.material = groundMaterial;
  hillRamp.checkCollisions = true;
  const bellElevation =
    0.12 + 0.175 + (39.75 - 33) * Math.sin(0.13);

  // A stepping-stone trail gives the opening a readable destination and keeps
  // the player from having to guess which way Mori is asking them to go.
  for (let index = 0; index < 10; index += 1) {
    const stone = MeshBuilder.CreateSphere(
      `wayfinder-trail-${index}`,
      { diameter: 1.5, segments: 8 },
      scene,
    );
    stone.position.set((index % 2 === 0 ? -0.22 : 0.22), 0.03, index * 2.2);
    stone.scaling.set(1, 0.08, 0.58);
    stone.material = pathMaterial;
  }

  // Pastel landmark colors are temporary, readable navigation cues. Each
  // material is shared across multiple low-poly boulders to keep draw setup
  // modest while avoiding a line of identical dark boxes.
  const landmarkMaterials = [
    new Color3(0.82, 0.56, 0.43),
    new Color3(0.73, 0.65, 0.86),
    new Color3(0.91, 0.73, 0.38),
    new Color3(0.4, 0.69, 0.61),
  ].map((color, index) => {
    const material = new StandardMaterial(`landmark-material-${index}`, scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    return material;
  });

  const landmarks = [
    [-7, 1.3, -1],
    [6, 1.3, 2],
    [-5, 1.3, 9],
    [8, 1.3, 12],
    [-10, 1.3, 17],
    [4, 1.3, 21],
  ];

  for (const [index, position] of landmarks.entries()) {
    const stone = MeshBuilder.CreateSphere(
      `meadow-boulder-${index}`,
      { diameter: 2.4, segments: 10 },
      scene,
    );
    stone.position.set(position[0], position[1], position[2]);
    stone.scaling.set(1.05, 0.88 + (index % 3) * 0.12, 0.9);
    stone.material = landmarkMaterials[index % landmarkMaterials.length];
    stone.checkCollisions = true;
  }

  const trunkMaterial = new StandardMaterial("tree-trunk-material", scene);
  trunkMaterial.diffuseColor = new Color3(0.39, 0.27, 0.19);
  const canopyMaterials = [
    new Color3(0.25, 0.51, 0.34),
    new Color3(0.34, 0.58, 0.4),
    new Color3(0.49, 0.63, 0.37),
  ].map((color, index) => {
    const material = new StandardMaterial(`tree-canopy-material-${index}`, scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.12, 0.16, 0.1);
    return material;
  });

  // Rounded tree clusters frame the path and add a distant meadow silhouette.
  const treePositions = [
    [-10, 0],
    [10, 3],
    [-12, 16],
    [11, 20],
    [-10, 33],
    [10, 39],
  ];

  for (const [index, [x, z]] of treePositions.entries()) {
    const trunk = MeshBuilder.CreateCylinder(
      `meadow-tree-trunk-${index}`,
      { height: 4.2, diameterTop: 0.55, diameterBottom: 0.9, tessellation: 7 },
      scene,
    );
    trunk.position.set(x, 2.1, z);
    trunk.material = trunkMaterial;
    trunk.checkCollisions = true;

    for (let canopyPart = 0; canopyPart < 3; canopyPart += 1) {
      const canopy = MeshBuilder.CreateSphere(
        `meadow-tree-canopy-${index}-${canopyPart}`,
        { diameter: 3.8, segments: 8 },
        scene,
      );
      canopy.position.set(
        x + (canopyPart - 1) * 1.3,
        4.7 + (canopyPart === 1 ? 1.1 : 0),
        z,
      );
      canopy.scaling.set(1, 0.86, 0.95);
      canopy.material = canopyMaterials[(index + canopyPart) % canopyMaterials.length];
      canopy.checkCollisions = true;
    }
  }

  // Emissive light lets the objective remain visible through the fog. The
  // same material is shared with the halo and returned to main.ts so the
  // discovery event can change its appearance without searching the scene.
  const beaconMaterial = new StandardMaterial("beacon-material", scene);
  beaconMaterial.diffuseColor = new Color3(0.2, 0.85, 0.66);
  beaconMaterial.emissiveColor = new Color3(0.08, 0.75, 0.48);
  beaconMaterial.specularColor = new Color3(0.6, 1, 0.85);

  const beacon = MeshBuilder.CreateSphere(
    "discovery-beacon",
    { diameter: 0.8, segments: 24 },
    scene,
  );
  beacon.position.set(0, 1.65, 18);
  beacon.material = beaconMaterial;

  const wayfinderMaterials: StandardMaterial[] = [];
  for (let index = 0; index < 3; index += 1) {
    const material = new StandardMaterial(`wayfinder-light-material-${index}`, scene);
    material.diffuseColor = new Color3(0.35, 0.3, 0.16);
    material.emissiveColor = new Color3(0.015, 0.012, 0.006);
    material.specularColor = new Color3(0.1, 0.1, 0.08);

    const light = MeshBuilder.CreateSphere(
      `wayfinder-light-${index}`,
      { diameter: 0.42, segments: 12 },
      scene,
    );
    light.position.set(index % 2 === 0 ? -0.5 : 0.5, 0.55, 24 + index * 4);
    light.material = material;
    wayfinderMaterials.push(material);
  }

  // The hilltop bell is visible from the start, but stays unlit until Mori
  // remembers it. The player can see where the story is going before the
  // objective is formally revealed.
  const bellMaterial = new StandardMaterial("hilltop-bell-material", scene);
  bellMaterial.diffuseColor = new Color3(0.9, 0.69, 0.28);
  bellMaterial.emissiveColor = new Color3(0.06, 0.045, 0.012);

  const bellTowerMaterial = new StandardMaterial("hilltop-tower-material", scene);
  bellTowerMaterial.diffuseColor = new Color3(0.72, 0.58, 0.4);
  bellTowerMaterial.specularColor = new Color3(0.2, 0.17, 0.12);

  for (const [index, [x, z]] of [
    [-0.75, 39],
    [0.75, 39],
    [-0.75, 40.5],
    [0.75, 40.5],
  ].entries()) {
    const towerPost = MeshBuilder.CreateCylinder(
      `hilltop-bell-post-${index}`,
      { height: 5.3, diameter: 0.32, tessellation: 8 },
      scene,
    );
    towerPost.position.set(x, bellElevation + 2.65, z);
    towerPost.material = bellTowerMaterial;
    towerPost.checkCollisions = true;
  }

  const towerRoof = MeshBuilder.CreateCylinder(
    "hilltop-bell-roof",
    { height: 1.8, diameterTop: 0, diameterBottom: 3.1, tessellation: 8 },
    scene,
  );
  towerRoof.position.set(0, bellElevation + 5.9, 39.75);
  towerRoof.material = landmarkMaterials[2];
  towerRoof.checkCollisions = true;

  const towerBase = MeshBuilder.CreateCylinder(
    "hilltop-bell-base",
    { height: 0.5, diameterTop: 2.7, diameterBottom: 3.4, tessellation: 8 },
    scene,
  );
  towerBase.position.set(0, bellElevation + 0.25, 39.75);
  towerBase.material = bellTowerMaterial;
  towerBase.checkCollisions = true;

  const hilltopBell = MeshBuilder.CreateSphere(
    "hilltop-bell",
    { diameter: 1, segments: 12 },
    scene,
  );
  hilltopBell.position.set(0, bellElevation + 4.05, 39.75);
  hilltopBell.material = bellMaterial;
  hilltopBell.checkCollisions = true;

  // Give the glowing discovery a small friendly face. These meshes are parented
  // to the orb so its features stay attached if the objective is animated.
  const faceMaterial = new StandardMaterial("beacon-face-material", scene);
  faceMaterial.diffuseColor = new Color3(0.09, 0.22, 0.24);
  faceMaterial.emissiveColor = new Color3(0.03, 0.07, 0.08);

  for (const [index, eyeX] of [-0.14, 0.14].entries()) {
    const eye = MeshBuilder.CreateSphere(
      `beacon-eye-${index}`,
      { diameter: 0.085, segments: 8 },
      scene,
    );
    eye.parent = beacon;
    eye.position.set(eyeX, 0.075, -0.375);
    eye.material = faceMaterial;
  }

  const smile = MeshBuilder.CreateTube(
    "beacon-smile",
    {
      path: [
        new Vector3(-0.1, -0.07, -0.38),
        new Vector3(0, -0.12, -0.4),
        new Vector3(0.1, -0.07, -0.38),
      ],
      radius: 0.016,
      tessellation: 6,
    },
    scene,
  );
  smile.parent = beacon;
  smile.material = faceMaterial;

  const pedestalMaterial = new StandardMaterial("pedestal-material", scene);
  pedestalMaterial.diffuseColor = new Color3(0.83, 0.67, 0.43);
  pedestalMaterial.specularColor = new Color3(0.2, 0.18, 0.12);

  const pedestal = MeshBuilder.CreateCylinder(
    "beacon-pedestal",
    { height: 0.45, diameterTop: 1.3, diameterBottom: 1.8, tessellation: 8 },
    scene,
  );
  pedestal.position.set(0, 0.22, 18);
  pedestal.material = pedestalMaterial;
  pedestal.checkCollisions = true;

  const halo = MeshBuilder.CreateTorus(
    "beacon-halo",
    { diameter: 1.8, thickness: 0.035, tessellation: 48 },
    scene,
  );
  halo.position.set(0, 0.5, 18);
  halo.rotation.x = Math.PI / 2;
  halo.material = beaconMaterial;

  // Animate only presentation: objective location and interaction range remain
  // stable. Delta time makes rotation independent of frame rate; the sine
  // offset uses a monotonic browser clock for a smooth floating effect.
  scene.onBeforeRenderObservable.add(() => {
    const elapsed = scene.getEngine().getDeltaTime();
    beacon.position.y = 1.65 + Math.sin(performance.now() * 0.0015) * 0.14;
    halo.rotation.z += elapsed * 0.0002;
  });

  return {
    scene,
    camera,
    beacon,
    beaconMaterial,
    wayfinderMaterials,
    bellMaterial,
  };
}