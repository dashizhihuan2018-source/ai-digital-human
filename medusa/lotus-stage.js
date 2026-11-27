import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  ShadowMaterial,
  SpotLight,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';

const turn = Math.PI * 2;
const tiers = [
  { count: 11, root: .104, y: -.102, length: .362, width: .100, rise: .042, cup: .041,
    twist: .024, phase: .12, colors: [0x351520, 0x682735, 0x9e4c48] },
  { count: 9, root: .091, y: -.077, length: .289, width: .087, rise: .053, cup: .036,
    twist: -.022, phase: .52, colors: [0x452031, 0x903b4d, 0xb56a59] },
  { count: 7, root: .076, y: -.053, length: .217, width: .065, rise: .049, cup: .023,
    twist: .014, phase: .16, colors: [0x563041, 0x9e4b56, 0xc38868] },
];

function petalPoint(tier, length, across) {
  const profile = .015 + .985 * Math.sin(Math.PI * length ** .76) ** .88;
  const bend = tier.twist * length ** 1.6;
  const roll = tier.cup * profile * (.86 * across ** 2 + .20 * across);
  return new Vector3(
    across * tier.width * profile + bend,
    tier.rise * length ** 2.6 - .021 * Math.sin(Math.PI * length) + roll,
    tier.length * length - .015 * across ** 2 * profile,
  );
}

function petalGeometry(tier) {
  const positions = [];
  const colors = [];
  const indices = [];
  const [root, silk, tip] = tier.colors.map(color => new Color(color));
  const shade = new Color();
  const lengthSteps = 24;
  const widthSteps = 10;
  for (let i = 0; i <= lengthSteps; i++) {
    const t = i / lengthSteps;
    for (let j = 0; j <= widthSteps; j++) {
      const u = j / widthSteps * 2 - 1;
      positions.push(...petalPoint(tier, t, u).toArray());
      const ridge = Math.exp(-18 * (u + .10) ** 2);
      shade.copy(root).lerp(silk, Math.sin(t * Math.PI / 2))
        .lerp(tip, .44 * Math.abs(u) ** 5 + .36 * t ** 4)
        .multiplyScalar(.78 + .24 * ridge + .04 * Math.cos(u * 30 + t * 3));
      colors.push(shade.r, shade.g, shade.b);
      if (i < lengthSteps && j < widthSteps) {
        const a = i * (widthSteps + 1) + j;
        const b = a + widthSteps + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function petalLine(tier, across, from, to, radius) {
  const points = Array.from({ length: 17 }, (_, i) => {
    const point = petalPoint(tier, from + (to - from) * i / 16, across);
    point.y += radius + .00055;
    return point;
  });
  return new TubeGeometry(new CatmullRomCurve3(points), 22, radius, 4, false);
}

function horizontal(geometry, material, y) {
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

function addGround(lotus) {
  const y = -.155;
  const floor = horizontal(
    new PlaneGeometry(5.4, 5.4),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 ground;
        void main() {
          ground = (uv - .5) * 5.4;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`,
      fragmentShader: `
        varying vec2 ground;
        void main() {
          float r = length(ground);
          float light = exp(-2.3 * dot(ground, ground * vec2(1., .85)));
          float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
          float alpha = (1. - smoothstep(.45, 2.55, r)) * (.32 + .62 * light);
          vec3 color = mix(vec3(.020, .013, .018), vec3(.128, .061, .047), light);
          color += (grain - .5) * .002;
          gl_FragColor = vec4(color, alpha);
          #include <colorspace_fragment>
        }`,
    }),
    y,
  );
  floor.renderOrder = 1;
  lotus.add(floor);

  const shadow = horizontal(
    new PlaneGeometry(2.4, 2.4),
    new ShadowMaterial({ color: 0x170b14, opacity: .38 }),
    y + .0004,
  );
  shadow.receiveShadow = true;
  shadow.renderOrder = 2;
  lotus.add(shadow);

  for (const [radius, width, opacity] of [[.53, .0023, .47], [.55, .0009, .29], [.74, .0014, .16]]) {
    const band = horizontal(
      new RingGeometry(radius, radius + width, 96),
      new MeshBasicMaterial({ color: 0xb67a54, transparent: true, opacity, depthWrite: false }),
      y + .0008,
    );
    band.renderOrder = 3;
    lotus.add(band);
  }
}

function addLightRig(scene, floor, height) {
  const aim = floor.clone().add(new Vector3(0, height * .56, 0));
  const ambient = new HemisphereLight(0xfff1eb, 0xa9808b, .96);
  ambient.name = 'LGT_Ambient_House';
  scene.add(ambient);

  const key = new SpotLight(0xffe7cb, 3.8 * height ** 2, 0, .48, .73, 2);
  key.name = 'LGT_Key_Overhead';
  key.position.copy(floor).add(new Vector3(.035, 1.90, .48).multiplyScalar(height));
  key.target.position.copy(aim);
  key.castShadow = true;
  const shadowResolution = matchMedia('(pointer: coarse)').matches ? 512 : 1024;
  key.shadow.mapSize.set(shadowResolution, shadowResolution);
  key.shadow.camera.near = height * .48;
  key.shadow.camera.far = height * 2.35;
  key.shadow.focus = .68;
  key.shadow.bias = -.00032;
  key.shadow.normalBias = height * .0014;
  key.shadow.radius = shadowResolution / 288;
  key.shadow.intensity = .83;
  scene.add(key, key.target);

  for (const [name, position, color, intensity] of [
    ['LGT_Fill_Face', [-.85, .32, 1.8], 0xffeee9, 1.45],
    ['LGT_Rim_Back', [.8, 1.16, -1.3], 0xe0c7ff, 1.65],
    ['LGT_Fill_Silk', [1.4, .32, 1.1], 0xddd1ff, .75],
  ]) {
    const light = new DirectionalLight(color, intensity);
    light.name = name;
    light.target.position.copy(aim);
    light.position.copy(aim).add(new Vector3(...position).multiplyScalar(height));
    scene.add(light, light.target);
  }
}

export function createLotusStage(scene, floor, height) {
  const lotus = new Group();
  lotus.name = 'Lotus stage';
  lotus.position.copy(floor);
  lotus.scale.setScalar(height);
  scene.add(lotus);
  addGround(lotus);

  const satin = new MeshStandardMaterial({
    vertexColors: true, side: DoubleSide, metalness: .24, roughness: .46,
  });
  const foil = new MeshStandardMaterial({
    color: 0xcd9165, metalness: .42, roughness: .40, emissive: 0x482219, emissiveIntensity: .21,
  });
  const vein = new MeshStandardMaterial({ color: 0x965046, metalness: .29, roughness: .56 });
  const bronze = new MeshStandardMaterial({ color: 0x4c2724, metalness: .50, roughness: .47 });
  const footplate = new Mesh(
    new CylinderGeometry(.166, .150, .023, 64),
    [bronze, new MeshStandardMaterial({ color: 0x40242a, roughness: .74 }), bronze],
  );
  footplate.position.y = -.0115;
  footplate.receiveShadow = true;
  lotus.add(footplate);

  const pedestal = new Mesh(
    new LatheGeometry([
      [.198, -.125], [.191, -.116], [.154, -.103], [.123, -.086], [.105, -.064],
      [.111, -.045], [.130, -.031], [.153, -.021],
    ].map(([radius, y]) => new Vector2(radius, y)), 64),
    bronze,
  );
  pedestal.castShadow = pedestal.receiveShadow = true;
  lotus.add(pedestal);

  const base = new Mesh(new CylinderGeometry(.233, .255, .031, 64), bronze);
  base.position.y = -.136;
  base.castShadow = base.receiveShadow = true;
  lotus.add(base);
  lotus.add(
    horizontal(new RingGeometry(.157, .162, 64), foil, .0006),
    horizontal(new RingGeometry(.243, .248, 64), foil, -.121),
  );

  const rows = tiers.map(tier => {
    const surfaces = new InstancedMesh(petalGeometry(tier), satin, tier.count);
    surfaces.castShadow = surfaces.receiveShadow = true;
    const edges = [-1, 1].map(side => new InstancedMesh(petalLine(tier, side, .35, .995, .00115), foil, tier.count));
    const crease = new InstancedMesh(petalLine(tier, -.11, .22, .88, .00082), vein, tier.count);
    const parts = [surfaces, ...edges, crease];
    for (const mesh of parts) mesh.frustumCulled = false;
    lotus.add(...parts);
    return { tier, parts };
  });

  const transform = new Object3D();
  function openPetals(amount) {
    for (const { tier, parts } of rows) {
      for (let i = 0; i < tier.count; i++) {
        const azimuth = (i + tier.phase) * turn / tier.count;
        transform.position.set(Math.sin(azimuth) * tier.root, tier.y, Math.cos(azimuth) * tier.root);
        transform.rotation.set((amount - 1) * .13 + Math.sin(i * 2.4) * .022, azimuth, 0, 'YXZ');
        transform.scale.set(1, 1, 1 + Math.sin(i * 2.1) * .035);
        transform.updateMatrix();
        for (const mesh of parts) mesh.setMatrixAt(i, transform.matrix);
      }
      for (const mesh of parts) mesh.instanceMatrix.needsUpdate = true;
    }
  }

  openPetals(1);
  addLightRig(scene, floor, height);
  return openPetals;
}
