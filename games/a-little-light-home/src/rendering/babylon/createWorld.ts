/**
 * Babylon.js scene factory for the first exploration slice.
 *
 * The caller creates and owns the Babylon Engine; this factory creates one
 * scene attached to that engine and returns the camera/beacon references that
 * the entry point needs for movement and interaction. Keeping the factory
 * deterministic makes the current scene straightforward to replace as the
 * game's setting and art direction become known.
 *
 * Geometry is deliberately procedural placeholder art. Havok supplies the
 * collision world, a capsule-based third-person character controller, and a
 * few dynamic objects. Static scenery uses simpler colliders; this is tuned
 * prototype physics, not a complete simulation of every visible object.
 */
import HavokPhysics from "@babylonjs/havok";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Physics/physicsEngineComponent";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsCharacterController } from "@babylonjs/core/Physics/v2/characterController";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Scene } from "@babylonjs/core/scene";

export interface GameWorld {
  /** Scene rendered each frame by the Babylon engine's render loop. */
  scene: Scene;
  /** Third-person camera orbiting the visible Wayfinder. */
  camera: ArcRotateCamera;
  /** Capsule controller that resolves contact against the Havok world. */
  characterController: PhysicsCharacterController;
  /** Visible child-friendly Wayfinder assembled from reusable scene shapes. */
  player: TransformNode;
  /** Temporary objective whose proximity and discovery state drive the UI. */
  beacon: Mesh;
  /** Exposed so the entry point can visibly dim the objective after discovery. */
  beaconMaterial: StandardMaterial;
  /** Three inactive path lights that become visible after Mori remembers home. */
  wayfinderMaterials: StandardMaterial[];
  /** Small warm lights that make the discovered path softly illuminate itself. */
  wayfinderLights: PointLight[];
  /** The distant bell's material, lit as the next story objective. */
  bellMaterial: StandardMaterial;
}

export async function createWorld(
  engine: Engine,
  canvas: HTMLCanvasElement,
): Promise<GameWorld> {
  const scene = new Scene(engine);
  const havokInstance = await HavokPhysics();
  scene.enablePhysics(
    new Vector3(0, -9.81, 0),
    new HavokPlugin(true, havokInstance),
  );

  // A soft sky tint and exponential fog keep the small placeholder world
  // bright, colorful, and visually calm without requiring a skybox asset.
  scene.clearColor = new Color4(0.55, 0.79, 0.81, 1);
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogDensity = 0.008;
  scene.fogColor = new Color3(0.55, 0.79, 0.81);

  const playerStart = new Vector3(0, 0.12, -12);
  const camera = new ArcRotateCamera(
    "player-camera",
    -Math.PI / 2,
    1.14,
    8,
    new Vector3(playerStart.x, playerStart.y + 1.05, playerStart.z),
    scene,
  );
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 12;
  camera.lowerBetaLimit = 0.55;
  camera.upperBetaLimit = 1.42;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 0;
  camera.inertia = 0.82;
  camera.attachControl(canvas, true);

  // Soft sky fill and warm directional light help simple shapes feel sunny
  // and welcoming without adding expensive post-processing.
  const ambient = new HemisphericLight(
    "ambient-light",
    new Vector3(0.2, 1, 0.1),
    scene,
  );
  ambient.intensity = 0.44;
  ambient.groundColor = new Color3(0.28, 0.38, 0.3);

  const moonlight = new DirectionalLight(
    "late-afternoon-sun",
    new Vector3(-0.45, -1, 0.35),
    scene,
  );
  moonlight.diffuse = new Color3(1, 0.84, 0.62);
  moonlight.intensity = 0.9;

  const shadows = new ShadowGenerator(1024, moonlight);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 18;

  function addStaticCollider(
    mesh: Mesh,
    shape: PhysicsShapeType = PhysicsShapeType.BOX,
  ): void {
    new PhysicsAggregate(
      mesh,
      shape,
      { mass: 0, friction: 0.95, restitution: 0.02 },
      scene,
    );
    mesh.receiveShadows = true;
  }

  // Soft green surfaces, late-afternoon light, and contact shadows help the
  // procedural shapes read like a small storybook set instead of a test map.
  const groundMaterial = new StandardMaterial("ground-material", scene);
  groundMaterial.diffuseColor = Color3.White();
  groundMaterial.specularColor = new Color3(0.045, 0.07, 0.04);
  const groundTexture = new DynamicTexture(
    "meadow-ground-texture",
    { width: 512, height: 512 },
    scene,
    true,
  );
  const groundContext = groundTexture.getContext();
  groundContext.fillStyle = "#819d70";
  groundContext.fillRect(0, 0, 512, 512);

  let textureSeed = 1647;
  const nextTextureValue = () => {
    textureSeed = (textureSeed * 16807) % 2147483647;
    return (textureSeed - 1) / 2147483646;
  };
  for (let patch = 0; patch < 900; patch += 1) {
    const hue = nextTextureValue() > 0.5 ? "#a5b88a" : "#617f57";
    const x = nextTextureValue() * 512;
    const y = nextTextureValue() * 512;
    const radius = 3 + nextTextureValue() * 8;
    groundContext.globalAlpha = 0.06 + nextTextureValue() * 0.08;
    groundContext.fillStyle = hue;
    groundContext.beginPath();
    groundContext.arc(x, y, radius, 0, Math.PI * 2);
    groundContext.fill();
  }
  for (let mark = 0; mark < 6800; mark += 1) {
    const hue = nextTextureValue() > 0.5 ? "#a0b58a" : "#668858";
    const x = nextTextureValue() * 512;
    const y = nextTextureValue() * 512;
    const length = 2 + nextTextureValue() * 6;
    groundContext.globalAlpha = 0.14 + nextTextureValue() * 0.14;
    groundContext.strokeStyle = hue;
    groundContext.lineWidth = 1.4;
    groundContext.beginPath();
    groundContext.moveTo(x, y);
    groundContext.lineTo(x + length * 0.35, y - length);
    groundContext.stroke();
  }
  groundContext.globalAlpha = 1;
  groundTexture.update();
  groundTexture.uScale = 22;
  groundTexture.vScale = 22;
  groundMaterial.diffuseTexture = groundTexture;
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100, subdivisions: 2 },
    scene,
  );
  ground.material = groundMaterial;
  addStaticCollider(ground);
  ground.receiveShadows = true;

  const hillMaterials = [
    new Color3(0.52, 0.69, 0.45),
    new Color3(0.64, 0.73, 0.5),
    new Color3(0.61, 0.69, 0.52),
  ].map((color, index) => {
    const material = new StandardMaterial(`distant-hill-material-${index}`, scene);
    material.diffuseColor = color;
    material.specularColor = Color3.Black();
    return material;
  });
  const distantHills = [
    [-26, -4, 13, 30, 17, 18],
    [25, -5, 23, 33, 20, 20],
    [-23, -8, 48, 36, 22, 23],
    [22, -9, 54, 40, 24, 25],
  ];
  for (const [index, [x, y, z, width, height, depth]] of distantHills.entries()) {
    const hill = MeshBuilder.CreateSphere(
      `meadow-hill-${index}`,
      { diameter: 1, segments: 12 },
      scene,
    );
    hill.position.set(x, y, z);
    hill.scaling.set(width, height, depth);
    hill.material = hillMaterials[index % hillMaterials.length];
  }

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
  addStaticCollider(hillRamp);
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

  const seedMaterials = [
    new Color3(0.96, 0.71, 0.39),
    new Color3(0.81, 0.66, 0.94),
    new Color3(0.94, 0.55, 0.48),
  ].map((color, index) => {
    const material = new StandardMaterial(`star-seed-material-${index}`, scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.45, 0.37, 0.24);
    return material;
  });

  // These round seed stones are small dynamic bodies. A careful nudge makes
  // them roll, bump into the ground, and settle under the same world gravity.
  const pushableSeeds = [
    [-2.4, 0.62, 5.5],
    [2.4, 0.62, 10.2],
    [-2.7, 0.62, 14.2],
  ];
  for (const [index, position] of pushableSeeds.entries()) {
    const seed = MeshBuilder.CreateSphere(
      `pushable-star-seed-${index}`,
      { diameter: 1.05, segments: 16 },
      scene,
    );
    seed.position.set(position[0], position[1], position[2]);
    seed.material = seedMaterials[index % seedMaterials.length];
    seed.receiveShadows = true;
    shadows.addShadowCaster(seed);
    new PhysicsAggregate(
      seed,
      PhysicsShapeType.SPHERE,
      { mass: 2.2, friction: 0.82, restitution: 0.12 },
      scene,
    );
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
    addStaticCollider(stone, PhysicsShapeType.MESH);
    shadows.addShadowCaster(stone);
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
    addStaticCollider(trunk, PhysicsShapeType.CYLINDER);
    shadows.addShadowCaster(trunk);

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
      canopy.receiveShadows = true;
      shadows.addShadowCaster(canopy);
    }
  }

  const grassMaterial = new StandardMaterial("meadow-grass-tuft-material", scene);
  grassMaterial.diffuseColor = new Color3(0.35, 0.61, 0.35);
  const petalMaterials = [
    new Color3(0.98, 0.83, 0.53),
    new Color3(0.88, 0.72, 0.9),
    new Color3(0.99, 0.68, 0.58),
  ].map((color, index) => {
    const material = new StandardMaterial(`meadow-flower-material-${index}`, scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.2, 0.16, 0.12);
    return material;
  });
  const flowerCenterMaterial = new StandardMaterial(
    "meadow-flower-center-material",
    scene,
  );
  flowerCenterMaterial.diffuseColor = new Color3(0.98, 0.76, 0.34);

  // A few hand-placed flower and grass clumps break up the large green planes
  // without crowding the stone trail or overwhelming slower devices.
  for (let index = 0; index < 18; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (5.1 + ((index * 7) % 5));
    const z = -8 + ((index * 11) % 47);
    const petalMaterial = petalMaterials[index % petalMaterials.length];

    for (let blade = 0; blade < 3; blade += 1) {
      const leaf = MeshBuilder.CreateCylinder(
        `meadow-grass-${index}-${blade}`,
        { height: 0.32, diameterTop: 0.015, diameterBottom: 0.05, tessellation: 4 },
        scene,
      );
      leaf.position.set(
        x + (blade - 1) * 0.13,
        0.16,
        z + (blade % 2 === 0 ? -0.08 : 0.08),
      );
      leaf.rotation.z = (blade - 1) * 0.28;
      leaf.material = grassMaterial;
    }

    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal / 5) * Math.PI * 2;
      const bloom = MeshBuilder.CreateSphere(
        `meadow-flower-${index}-${petal}`,
        { diameter: 0.18, segments: 6 },
        scene,
      );
      bloom.position.set(
        x + Math.cos(angle) * 0.13,
        0.34 + Math.sin(angle) * 0.035,
        z + Math.sin(angle) * 0.13,
      );
      bloom.scaling.y = 0.62;
      bloom.material = petalMaterial;
    }

    const flowerCenter = MeshBuilder.CreateSphere(
      `meadow-flower-center-${index}`,
      { diameter: 0.11, segments: 8 },
      scene,
    );
    flowerCenter.position.set(x, 0.36, z);
    flowerCenter.material = flowerCenterMaterial;
  }

  const player = new TransformNode("wayfinder", scene);
  player.position.copyFrom(playerStart);

  const robeMaterial = new StandardMaterial("wayfinder-robe-material", scene);
  robeMaterial.diffuseColor = new Color3(0.29, 0.59, 0.53);
  robeMaterial.specularColor = new Color3(0.12, 0.18, 0.16);
  const skinMaterial = new StandardMaterial("wayfinder-skin-material", scene);
  skinMaterial.diffuseColor = new Color3(0.94, 0.7, 0.54);
  const scarfMaterial = new StandardMaterial("wayfinder-scarf-material", scene);
  scarfMaterial.diffuseColor = new Color3(0.96, 0.69, 0.34);
  const hairMaterial = new StandardMaterial("wayfinder-hair-material", scene);
  hairMaterial.diffuseColor = new Color3(0.32, 0.19, 0.16);
  const bootMaterial = new StandardMaterial("wayfinder-boot-material", scene);
  bootMaterial.diffuseColor = new Color3(0.39, 0.3, 0.25);
  const eyeMaterial = new StandardMaterial("wayfinder-eye-material", scene);
  eyeMaterial.diffuseColor = new Color3(0.12, 0.18, 0.19);

  const robe = MeshBuilder.CreateCapsule(
    "wayfinder-robe",
    { height: 1.25, radius: 0.34, tessellation: 12, subdivisions: 4 },
    scene,
  );
  robe.parent = player;
  robe.position.y = 0.88;
  robe.material = robeMaterial;
  shadows.addShadowCaster(robe);

  for (const side of [-1, 1]) {
    const sleeve = MeshBuilder.CreateCapsule(
      `wayfinder-sleeve-${side}`,
      { height: 0.62, radius: 0.15, tessellation: 10, subdivisions: 3 },
      scene,
    );
    sleeve.parent = player;
    sleeve.position.set(side * 0.39, 1.02, 0);
    sleeve.rotation.z = side * -0.22;
    sleeve.material = scarfMaterial;

    const hand = MeshBuilder.CreateSphere(
      `wayfinder-hand-${side}`,
      { diameter: 0.2, segments: 10 },
      scene,
    );
    hand.parent = player;
    hand.position.set(side * 0.45, 0.69, 0.06);
    hand.material = skinMaterial;

    const boot = MeshBuilder.CreateCapsule(
      `wayfinder-boot-${side}`,
      { height: 0.46, radius: 0.14, tessellation: 8, subdivisions: 2 },
      scene,
    );
    boot.parent = player;
    boot.position.set(side * 0.16, 0.24, 0.05);
    boot.material = bootMaterial;
  }

  const face = MeshBuilder.CreateSphere(
    "wayfinder-face",
    { diameter: 0.68, segments: 16 },
    scene,
  );
  face.parent = player;
  face.position.y = 1.65;
  face.material = skinMaterial;
  shadows.addShadowCaster(face);

  const hair = MeshBuilder.CreateSphere(
    "wayfinder-hair",
    { diameter: 0.72, segments: 12 },
    scene,
  );
  hair.parent = player;
  hair.position.set(0, 1.88, -0.08);
  hair.scaling.set(1, 0.58, 1);
  hair.material = hairMaterial;

  const scarf = MeshBuilder.CreateTorus(
    "wayfinder-scarf",
    { diameter: 0.72, thickness: 0.16, tessellation: 16 },
    scene,
  );
  scarf.parent = player;
  scarf.position.y = 1.27;
  scarf.rotation.x = Math.PI / 2;
  scarf.material = scarfMaterial;

  const backpackMaterial = new StandardMaterial("wayfinder-pack-material", scene);
  backpackMaterial.diffuseColor = new Color3(0.63, 0.43, 0.29);
  const backpack = MeshBuilder.CreateCapsule(
    "wayfinder-pack",
    { height: 0.62, radius: 0.22, tessellation: 10, subdivisions: 3 },
    scene,
  );
  backpack.parent = player;
  backpack.position.set(0, 0.98, -0.36);
  backpack.material = backpackMaterial;
  shadows.addShadowCaster(backpack);

  const packFlap = MeshBuilder.CreateSphere(
    "wayfinder-pack-flap",
    { diameter: 0.18, segments: 8 },
    scene,
  );
  packFlap.parent = player;
  packFlap.position.set(0, 1.21, -0.55);
  packFlap.scaling.set(1.25, 0.8, 0.42);
  packFlap.material = scarfMaterial;

  for (const eyeX of [-0.14, 0.14]) {
    const eye = MeshBuilder.CreateSphere(
      `wayfinder-eye-${eyeX}`,
      { diameter: 0.075, segments: 8 },
      scene,
    );
    eye.parent = player;
    eye.position.set(eyeX, 1.68, 0.306);
    eye.material = eyeMaterial;
  }

  const characterController = new PhysicsCharacterController(
    playerStart,
    { capsuleHeight: 1.8, capsuleRadius: 0.38 },
    scene,
  );
  characterController.characterMass = 72;
  characterController.characterStrength = 7;
  characterController.maxSlopeCosine = Math.cos((42 * Math.PI) / 180);

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
  const wayfinderLights: PointLight[] = [];
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

    const pathLight = new PointLight(
      `wayfinder-point-light-${index}`,
      light.position.clone(),
      scene,
    );
    pathLight.diffuse = new Color3(1, 0.82, 0.48);
    pathLight.intensity = 0;
    pathLight.range = 5;
    wayfinderLights.push(pathLight);
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
    addStaticCollider(towerPost, PhysicsShapeType.CYLINDER);
    shadows.addShadowCaster(towerPost);
  }

  const towerRoof = MeshBuilder.CreateCylinder(
    "hilltop-bell-roof",
    { height: 1.8, diameterTop: 0, diameterBottom: 3.1, tessellation: 8 },
    scene,
  );
  towerRoof.position.set(0, bellElevation + 5.9, 39.75);
  towerRoof.material = landmarkMaterials[2];
  addStaticCollider(towerRoof);

  const towerBase = MeshBuilder.CreateCylinder(
    "hilltop-bell-base",
    { height: 0.5, diameterTop: 2.7, diameterBottom: 3.4, tessellation: 8 },
    scene,
  );
  towerBase.position.set(0, bellElevation + 0.25, 39.75);
  towerBase.material = bellTowerMaterial;
  addStaticCollider(towerBase, PhysicsShapeType.CYLINDER);

  const hilltopBell = MeshBuilder.CreateSphere(
    "hilltop-bell",
    { diameter: 1, segments: 12 },
    scene,
  );
  hilltopBell.position.set(0, bellElevation + 4.05, 39.75);
  hilltopBell.material = bellMaterial;

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
  addStaticCollider(pedestal, PhysicsShapeType.CYLINDER);

  const halo = MeshBuilder.CreateTorus(
    "beacon-halo",
    { diameter: 1.8, thickness: 0.035, tessellation: 48 },
    scene,
  );
  halo.position.set(0, 0.5, 18);
  halo.rotation.x = Math.PI / 2;
  halo.material = beaconMaterial;

  const starGlow = new HemisphericLight(
    "star-seed-fill",
    new Vector3(0, 1, 0),
    scene,
  );
  starGlow.diffuse = new Color3(0.92, 0.78, 0.5);
  starGlow.specular = new Color3(0.92, 0.78, 0.5);
  starGlow.intensity = 0.08;

  // Animate only presentation: objective location and interaction range remain
  // stable. Delta time makes rotation independent of frame rate; the sine
  // offset uses a monotonic browser clock for a smooth floating effect.
  scene.onBeforeRenderObservable.add(() => {
    const elapsed = scene.getEngine().getDeltaTime();
    beacon.position.y = 1.65 + Math.sin(performance.now() * 0.0015) * 0.14;
    halo.rotation.z += elapsed * 0.0002;
    camera.target.copyFromFloats(
      player.position.x,
      player.position.y + 1.02,
      player.position.z,
    );
  });

  return {
    scene,
    camera,
    characterController,
    player,
    beacon,
    beaconMaterial,
    wayfinderMaterials,
    wayfinderLights,
    bellMaterial,
  };
}