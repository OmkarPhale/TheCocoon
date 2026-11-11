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

  // A dark green clear color and exponential fog establish a simple visual
  // treatment while hiding the edge of the deliberately empty test space.
  scene.clearColor = new Color4(0.025, 0.07, 0.065, 1);
  scene.fogMode = Scene.FOGMODE_EXP;
  scene.fogDensity = 0.008;
  scene.fogColor = new Color3(0.025, 0.07, 0.065);

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

  // Two inexpensive lights make primitive materials readable without adding
  // environment maps or post-processing to this first rendering test.
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
  moonlight.diffuse = new Color3(0.47, 0.77, 0.7);
  moonlight.intensity = 1.1;

  // The ground and box landmarks are navigation cues, not final level art.
  // This is a visual-only scene: these meshes do not currently block movement.
  const groundMaterial = new StandardMaterial("ground-material", scene);
  groundMaterial.diffuseColor = new Color3(0.09, 0.18, 0.16);
  groundMaterial.specularColor = new Color3(0.12, 0.2, 0.18);
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100, subdivisions: 2 },
    scene,
  );
  ground.material = groundMaterial;

  const stoneMaterial = new StandardMaterial("stone-material", scene);
  stoneMaterial.diffuseColor = new Color3(0.13, 0.25, 0.21);
  stoneMaterial.specularColor = new Color3(0.08, 0.12, 0.1);

  const landmarks = [
    [-7, 1.3, -1],
    [6, 1.3, 2],
    [-5, 1.3, 9],
    [8, 1.3, 12],
    [-10, 1.3, 17],
    [4, 1.3, 21],
  ];

  for (const [index, position] of landmarks.entries()) {
    const stone = MeshBuilder.CreateBox(
      `landmark-${index}`,
      { width: 2.4, height: 2.6, depth: 2.4 },
      scene,
    );
    stone.position.set(position[0], position[1], position[2]);
    stone.rotation.y = index * 0.43;
    stone.material = stoneMaterial;
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

  const pedestal = MeshBuilder.CreateCylinder(
    "beacon-pedestal",
    { height: 0.45, diameterTop: 1.3, diameterBottom: 1.8, tessellation: 8 },
    scene,
  );
  pedestal.position.set(0, 0.22, 18);
  pedestal.material = stoneMaterial;

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
    beacon.rotation.y += elapsed * 0.0007;
    beacon.position.y = 1.65 + Math.sin(performance.now() * 0.0015) * 0.14;
    halo.rotation.z += elapsed * 0.0002;
  });

  return { scene, camera, beacon, beaconMaterial };
}