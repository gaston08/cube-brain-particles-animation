import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import * as TWEEN from '@tweenjs/tween.js';
console.clear();

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(2, -1.5, 3).setLength(3);
camera.lookAt(scene.position)
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
window.addEventListener("resize", event => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight)
})

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

let instObj = [];
let instStart = [];
let instFinish = [];
let c = new THREE.Color();
let n = new THREE.Vector3();
let tetrahedra;
const loader = new GLTFLoader().setPath('https://cywarr.github.io/small-shop/');
loader.load('ali_brain.gltf', function (gltf) {
  let model = gltf.scene.children[0].children[0];

  let sampler = new MeshSurfaceSampler(model).build();
  let samplerBox = new MeshSurfaceSampler(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))).build();
  let MAX_COUNT = 10000;
  tetrahedra = new THREE.InstancedMesh(
    new THREE.TetrahedronGeometry(0.025),
    new THREE.MeshStandardMaterial({
      //color: 0xff88cc,
      //wireframe: true,
      roughness: 0.5,
      metalness: 0.75
    }), MAX_COUNT);
  let dummy = new THREE.Object3D();
  let aX = new THREE.Vector3(1, 0, 0), aY = new THREE.Vector3(0, 1, 0), aZ = new THREE.Vector3(0, 0, 1);
  let nor = new THREE.Vector3();
  for (let idx = 0; idx < MAX_COUNT; idx++) {
    let v = new THREE.Vector3();
    sampler.sample(v, nor);

    n.copy(v).normalize();
    let d = Math.pow(n.dot(nor), 2);
    d = THREE.MathUtils.clamp(d, 0, 1);
    c.setHSL(1 - d, 1, 0.5);
    tetrahedra.setColorAt(idx, c);

    nor
      .applyAxisAngle(aX, Math.PI * (0.5 * Math.random() - 0.25))
      .applyAxisAngle(aY, Math.PI * (0.5 * Math.random() - 0.25))
      .applyAxisAngle(aZ, Math.PI * (0.5 * Math.random() - 0.25));
    v.addScaledVector(nor, 0.1);
    dummy.position.copy(v);
    dummy.rotation.set(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
    dummy.updateMatrix();
    tetrahedra.setMatrixAt(idx, dummy.matrix);

    instObj.push(dummy.clone());
    instStart.push(v.clone());
    
    samplerBox.sample(v);
    instFinish.push(v.clone());
  };
  scene.add(tetrahedra);
  //scene.add( model );

  let tween = new TWEEN.Tween({ val: 0 }).to({ val: 1 }, 2000)
    .delay(2000)
    .repeat(Infinity)
    .yoyo(true)
    .onUpdate(val => {
      instObj.forEach((o, idx) => {
        o.position.lerpVectors(instStart[idx], instFinish[idx], val.val);
        o.updateMatrix();
        tetrahedra.setMatrixAt(idx, o.matrix);
      })
      tetrahedra.instanceMatrix.needsUpdate = true;
    })
    .start();

});

let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  let t = clock.getDelta() * 2;
  controls.update();
  TWEEN.update();
  instObj.forEach((o, idx) => {
    o.rotation.x += t;
    o.rotation.y += t;
    o.updateMatrix();
    tetrahedra.setMatrixAt(idx, o.matrix);
  })
  if (tetrahedra) tetrahedra.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
})

