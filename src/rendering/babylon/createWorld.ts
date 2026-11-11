/**
 * Babylon.js scene factory for the first exploration slice.
 *
 * The caller creates and owns the Babylon Engine; this factory creates one
 * scene attached to that engine and returns the camera/beacon references that
 * the entry point needs for movement and interaction. Keeping the factory
 * deterministic makes the current scene straightforward to replace as the
 * game's setting and art direction become known.
 *
 * Geometry is deliberately procedural placeholder art. There is no imported
 * asset pipeline, collision system, physics world, player avatar, level
 * streaming, or multiplayer state in this scene yet.
 */
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
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
  /** First-person viewpoint; input currently moves this camera directly. */
  camera: FreeCamera;
  /** Temporary objective whose proximity and discovery state drive the UI. */
  beacon: Mesh;
  /** Exposed so the entry point can visibly dim the objective after discovery. */
  beaconMaterial: StandardMaterial;
}

export function createWorld(
  engine: Engine,
  canvas: HTMLCanvasElement,
): GameWorld {
  const scene = new Scene(engine);

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
  camera.attachControl(canvas, true);

  // Soft sky fill and warm directional light help simple shapes feel sunny
  // and welcoming without adding expensive post-processing.
  const ambient = new HemisphericLight(
    "ambient-light",
    new Vector3(0.2, 1, 0.1),
    scene,
  );
  ambient.intensity = 0.75;

  const moonlight = new DirectionalLight(
    "moonlight",
    new Vector3(-0.4, -1, 0.3),
    scene,
  );
  moonlight.diffuse = new Color3(1, 0.86, 0.65);
  moonlight.intensity = 1.25;

  // The meadow uses a soft green floor rather than the darker placeholder
  // palette from the first technical rendering test.
  const groundMaterial = new StandardMaterial("ground-material", scene);
  groundMaterial.diffuseColor = new Color3(0.32, 0.58, 0.37);
  groundMaterial.specularColor = new Color3(0.16, 0.22, 0.15);
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100, subdivisions: 2 },
    scene,
  );
  ground.material = groundMaterial;

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

  return { scene, camera, beacon, beaconMaterial };
}