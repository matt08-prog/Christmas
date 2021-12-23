import * as THREE from './three.module.js';

import {OrbitControls} from './OrbitControls.js';
import { FirstPersonControls } from "./FirstPersonControls.js";

import { Clock } from "./three.module.js";
import { TTFLoader } from "./TTFLoader.js";

// import Proton from "three.proton.js";
// proton
const vshader = `
varying vec2 v_uv;
varying vec3 v_position;
uniform float u_time;


void main() {	
  float time = u_time / 4.0;
  v_uv = uv;
  v_position = position + sin(time);
  //vec3 pos =  position + position.x  * sin(u_time)*0.03 + position.y  * sin(u_time)*0.02 + position.x  * sin(u_time * 0.8)*0.03;
  vec3 pos = position;
  pos.z +=  (sin(pos.x*1.0 + time * 1.0) * 4.0 + sin(pos.x*1.0 + time * 1.0) * 10.0 + sin(pos.y*1.4 + time * 1.0) * 10.0) / 3.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0 );
}
`;

const fshader = `
#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_duration;
uniform sampler2D u_tex;

varying vec2 v_uv;
varying vec3 v_position;

void main (void)
{
  float mouseY = 12.0*(u_mouse.y/u_resolution.y);
  float tilecount = 80.0;
  // mabey p1 should be floor instead of fract?
  vec2 p1 = v_position.xy*tilecount;
  vec2 p2 = v_uv*tilecount;
  // vec3 color = texture2D(u_tex, p2).rgb;
  
  float len = length(p1);
  vec2 uv_1 = p2;
  // 0.03, 12.0, 4.0
  //vec2 ripple = p2 * 1.0 * vec2(u_time * -0.05);
  //vec2 ripple = p2 + p1/len*0.03*cos(len*12.0-u_time*4.0);
  //vec2 ripple = p2 + (p1*len*((sin(u_time) + 1.0) * 0.5) * 0.8);
  //vec2 ripple = p2 + (p1*len*((sin(u_time) + 1.0) * 0.5) * 0.8);
  //vec2 ripple = p2 + p1*len*(((sin(u_time) + 1.0) * 0.5) * 0.02);
  vec2 ripple = uv_1;
  ripple.y += ((sin(p2.x * 0.7 + u_time*1.2) + 1.0) * 0.5) * 0.2;
  ripple.y += ((sin(p2.x * 0.6 + u_time*0.5) + 1.0) * 0.5) * 0.1;
  ripple.y += ((sin(p2.x * 0.6 + u_time*0.7) + 1.0) * 0.5) * 0.3;
  ripple.x += ((sin(p2.y * 0.7 + u_time*1.2) + 1.0) * 0.5) * 0.2;
  ripple.x += ((sin(p2.y * 0.6 + u_time*0.5) + 1.0) * 0.5) * 0.1;
  ripple.x += ((sin(p2.y * 0.6 + u_time*0.7) + 1.0) * 0.5) * 0.3;
  // ripple.x += ((sin(p2.y * 0.3 + u_time*1.2) + 1.0) * 0.5) * 0.3;
  // ripple.x += ((sin(p2.y * 0.2 + u_time*1.2) + 1.0) * 0.5) * 0.4;
  //ripple.x += p1.y*len*(((sin(u_time) + 1.0) * 0.5) * 0.03);
  //ripple.x += p1.y*len*(((sin(u_time) + 1.0) * 0.5) * 0.02);
  
  
  float delta = (((sin(u_time)+1.0)/2.0)* u_duration)/u_duration;
  // y = (sin(x) + sin(2.2x+5.52) + sin(2.9x+0.93) + sin(4.6x+8.94)) / 4
  vec2 uv = mix(ripple, p1, 0.0);
  // 32,107,177 - sea
  vec3 color = vec3(0);
  //color = texture2D(u_tex, ripple * 1.0).rgb * vec3(32.0/255.0, 107.0/255.0, 177.0/255.0);
  if(texture2D(u_tex, ripple * 1.0).r > 0.6) {
    color = texture2D(u_tex, ripple * 1.0).rgb * vec3(1.0, 1.0, 1.0);
  } else if(texture2D(u_tex, (ripple * 1.0) + 0.5).r > 0.8){
    color = texture2D(u_tex, (ripple * 1.0) + 0.5).rgb * vec3(0.0, 80.0/255.0, 141.0/255.0);
  } else {
    color = vec3(32.0/255.0, 107.0/255.0, 177.0/255.0);
  }
  
  // rgb(0,105,184)
  
  gl_FragColor = vec4(color, 1.0); 
}
`;
class BasicWorldDemo {
  constructor() {
    this._Initialize();
    this.renderer = this.renderer;
    this.clock = new Clock
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      "resize",
      () => {
        this._OnWindowResize();
      },
      false
    );

    alert(
      "Press down with either mouse button and aim where you want to look."
    );

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 10000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(20, 20, 0);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);

    this.mouseDown = 0;
    document.addEventListener("pointerdown", (event) => {
      console.log("Pointer down event");
      ++this.mouseDown;
    });
    document.addEventListener("pointerup", (event) => {
      console.log("Pointer up event");
      --this.mouseDown;
    });

    this.controls = new FirstPersonControls(
      this._camera,
      this._threejs.domElement
    );
    this.controls.movementSpeed = 0;

    //controls.target.set(0, 20, 0);

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      "./resources/sea/posx.png",
      "./resources/sea/negx.png",
      "./resources/sea/posy.png",
      "./resources/sea/negy.png",
      "./resources/sea/posz.png",
      "./resources/sea/negz.png",
    ]);
    this._scene.background = texture;

    var load = new THREE.TextureLoader();

    this.oceanTex = load.load(
      "https://cinemont.com/tutorials/zelda/water.png",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set(0, 0);
        texture.repeat.set(5, 5);
      }
    );

    this.uniforms = {
      u_tex: {
        value: this.oceanTex,
      },
      u_duration: { value: 2.0 },
      u_time: { value: 0.0 },
      u_mouse: { value: { x: 0.0, y: 0.0 } },
      u_resolution: { value: { x: 0, y: 0 } },
    };

    console.log(this.uniforms.u_tex);
    let self = this;

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vshader,
      fragmentShader: fshader,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000, 10, 10),
      material
    );

    this.oceanTex.offset.y += 10;

    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    // const pointMaterial = new THREE.PointsMaterial({
    //   size: 8,
    //   color: 0xffffff,
    //   vertexColors: false,
    //   map: getTexture(),
    //   // blending: THREE.AdditiveBlending,
    //   transparent: true,
    //   // opacity: 0.8,
    //   fog: true,
    //   depthWrite: false,
    // });

    var load1 = new THREE.TextureLoader();
    this.snowTex = load1.load("./snow3.png");
    var load2 = new THREE.TextureLoader();
    this.alpha = load2.load("./alpha.png");

    this.vertices = [];

    for (let i = 0; i < 10000; i++) {
      const x = THREE.MathUtils.randFloatSpread(100);
      const y = THREE.MathUtils.randFloatSpread(100);
      const z = THREE.MathUtils.randFloatSpread(100);

      this.vertices.push(x, y, z);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.vertices, 3)
    );

    const material3 = new THREE.PointsMaterial({
      color: 0xffffff,
      alphaMap: this.alpha,
      map: this.snowTex,
      transparent: true,
    });

    this.points = new THREE.Points(this.geometry, material3);
    // 55
    this._scene.add(this.points);

    this.points1 = new THREE.Points(this.geometry, material3);
    this.points1.position.y = 50;
    // 55
    this._scene.add(this.points1);

    // const floader = new THREE.FontLoader();
    // const json = JSON.parse("./PressStart2P-Regular.json"); // you have to parse the data so it becomes a JS object
    // const font = floader.parse(json);
    
    // const textg = new THREE.TextGeometry("Hello three.js!", {
      //   font: font,
    //   size: 80,
    //   height: 5,
    //   curveSegments: 12,
    //   bevelEnabled: true,
    //   bevelThickness: 10,
    //   bevelSize: 8,
    //   bevelOffset: 0,
    //   bevelSegments: 5,
    // });
    
    // const fontLoad = new THREE.FontLoader();
    // fontLoad.load("./PressStart2P-Regular.json", function (font) {

    let font;

    this.floader = new TTFLoader();
    this.fontLoader = new THREE.FontLoader();
    this.floader.load("./PressStart2P-Regular.ttf", (fnt) => {
      font = this.fontLoader.parse(fnt);
      const fgeometry = new THREE.TextGeometry("  MERRY\nCHRISTMAS", {
        font: font,
        size: 5,
        height: 5,
      });
      fgeometry.computeBoundingBox();
      const fmaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x404040
      }); // front
      const centerOffset =
        -0.5 * (fgeometry.boundingBox.max.x - fgeometry.boundingBox.min.x);
        this.mesh = new THREE.Mesh(fgeometry, fmaterial);
        this.mesh.name = "text";
        this.mesh.position.z = centerOffset - 10;
        this.mesh.position.y = 25;
        this.mesh.position.x = -12;
        
        this.mesh.rotation.x = 0;
        this._scene.add(this.mesh);
    });






    this._RAF(self);
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  // update loop
  _RAF(self) {
    requestAnimationFrame(() => {
      this.points.position.y -= 0.045;
      this.points.position.x -= 0.01 * Math.sin(this.points.position.y);
      //console.log(this.points1.position.y)
      if (this.points.position.y < -50) {
        this.points.position.y = 50;
      }

      this.points1.position.y -= 0.045;
      this.points1.position.x -= 0.01 * Math.sin(this.points1.position.y);
      //console.log(this.points.position.y)
      if (this.points1.position.y < -50) {
        this.points1.position.y = 50;
      }
        this.uniforms.u_time.value += this.clock.getDelta();
      this.oceanTex.transformUv(new THREE.Vector2(this.clock.getDelta()*700, 0));
      this._threejs.render(this._scene, this._camera);
      if (this.mouseDown) {
        this.controls.enabled = true;
        console.log("true");
      } else {
        this.controls.enabled = false;
        console.log("false");
      }
      this.controls.update(this.clock.getDelta()*1000.0);
      this._RAF();
    });
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});
