import React, { useEffect, useRef, useState } from 'react';
import type { AvatarState } from '../types';
import type { AvatarAnimationController as RendererAnimationController } from '../services/avatar-animation';
import { VRMAvatarRenderer } from '../services/vrm-avatar-renderer';

interface VRMAvatarProps {
  source: string;
  fallbackSource?: string;
  alt: string;
  state: AvatarState;
  animationController?: RendererAnimationController;
}

type Runtime = {
  THREE: any;
  GLTFLoader: any;
  VRMLoaderPlugin: any;
  VRMUtils: any;
};

async function loadRuntime(): Promise<Runtime> {
  const THREE = await import(
    /* @vite-ignore */
    'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'
  ) as any;
  const { GLTFLoader } = await import(
    /* @vite-ignore */
    'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js'
  ) as any;
  const { VRMLoaderPlugin, VRMUtils } = await import(
    /* @vite-ignore */
    'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.5.5/lib/three-vrm.module.min.js'
  ) as any;
  return { THREE, GLTFLoader, VRMLoaderPlugin, VRMUtils };
}

function createRoundGlasses(THREE: any, head: any, modelHeight: number) {
  if (!head) return null;

  const group = new THREE.Group();
  group.name = 'wiztalk-vrm-glasses';

  const frameRadius = Math.max(0.055, Math.min(0.095, modelHeight * 0.055));
  const frameTube = frameRadius * 0.075;
  const eyeSpacing = frameRadius * 2.15;
  const lensZ = -Math.max(0.045, modelHeight * 0.035);
  const bridgeWidth = eyeSpacing * 0.72;

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x171717,
    metalness: 0.55,
    roughness: 0.3,
  });

  const leftFrame = new THREE.Mesh(
    new THREE.TorusGeometry(frameRadius, frameTube, 12, 48),
    frameMaterial,
  );
  leftFrame.position.set(-eyeSpacing / 2, 0, lensZ);

  const rightFrame = new THREE.Mesh(
    new THREE.TorusGeometry(frameRadius, frameTube, 12, 48),
    frameMaterial,
  );
  rightFrame.position.set(eyeSpacing / 2, 0, lensZ);

  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(frameTube, frameTube, bridgeWidth, 12),
    frameMaterial,
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0, lensZ);

  group.add(leftFrame, rightFrame, bridge);

  const armLength = frameRadius * 2.7;
  const leftArm = new THREE.Mesh(
    new THREE.CylinderGeometry(frameTube * 0.8, frameTube * 0.8, armLength, 10),
    frameMaterial,
  );
  leftArm.rotation.z = Math.PI / 2;
  leftArm.position.set(-eyeSpacing / 2 - armLength / 2, 0, lensZ + frameTube);

  const rightArm = new THREE.Mesh(
    new THREE.CylinderGeometry(frameTube * 0.8, frameTube * 0.8, armLength, 10),
    frameMaterial,
  );
  rightArm.rotation.z = Math.PI / 2;
  rightArm.position.set(eyeSpacing / 2 + armLength / 2, 0, lensZ + frameTube);

  group.add(leftArm, rightArm);
  head.add(group);
  group.position.set(0, modelHeight * 0.008, 0);

  return group;
}

export function VRMAvatar({ source, fallbackSource, alt, state, animationController }: VRMAvatarProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VRMAvatarRenderer | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !source) return undefined;

    let disposed = false;
    let animationFrame = 0;
    let runtimeRenderer: any;
    let currentVrm: any;
    let glassesGroup: any;
    let controllerDetach: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const rendererAdapter = new VRMAvatarRenderer();
    rendererRef.current = rendererAdapter;

    const mount = async () => {
      try {
        setStatus('loading');
        setErrorMessage('');
        const { THREE, GLTFLoader, VRMLoaderPlugin, VRMUtils } = await loadRuntime();
        if (disposed) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
        camera.position.set(0, 1.05, 5);

        runtimeRenderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        runtimeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        runtimeRenderer.setClearColor(0x000000, 0);
        if ('outputColorSpace' in runtimeRenderer && THREE.SRGBColorSpace) {
          runtimeRenderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        runtimeRenderer.domElement.className = 'h-full w-full';
        runtimeRenderer.domElement.setAttribute('aria-label', alt);
        runtimeRenderer.domElement.setAttribute('role', 'img');
        host.appendChild(runtimeRenderer.domElement);

        const ambient = new THREE.HemisphereLight(0xffffff, 0x22142f, 1.8);
        scene.add(ambient);
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(1.5, 2.5, 3.5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x9ec5ff, 1.1);
        fillLight.position.set(-2, 1.5, 1.5);
        scene.add(fillLight);

        const loader = new GLTFLoader();
        loader.crossOrigin = 'anonymous';
        loader.register((parser: any) => new VRMLoaderPlugin(parser));

        const gltf = await loader.loadAsync(source);
        if (disposed) return;

        currentVrm = gltf.userData?.vrm;
        if (!currentVrm) throw new Error('VRM model loaded but no VRM runtime was found.');

        VRMUtils.removeUnnecessaryVertices?.(gltf.scene);
        VRMUtils.combineSkeletons?.(gltf.scene);
        VRMUtils.combineMorphs?.(currentVrm);
        currentVrm.scene.traverse((object: any) => { object.frustumCulled = false; });

        const box = new THREE.Box3().setFromObject(currentVrm.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const height = Math.max(size.y, 1);
        const distance = Math.max(
          1.8,
          (height * 0.48) / Math.tan((camera.fov * Math.PI) / 360),
        );
        camera.position.set(
          center.x,
          center.y + height * 0.03,
          center.z + distance,
        );
        camera.near = Math.max(0.01, distance / 100);
        camera.far = Math.max(50, distance * 8);
        camera.lookAt(center.x, center.y + height * 0.03, center.z);
        camera.updateProjectionMatrix();

        scene.add(currentVrm.scene);

        const head = currentVrm.humanoid?.getNormalizedBoneNode?.('head');
        glassesGroup = createRoundGlasses(THREE, head, height);

        rendererAdapter.setVrm(currentVrm);
        rendererAdapter.setState(state);
        if (animationController) {
          controllerDetach = animationController.attachAdapter(rendererAdapter);
        }
        setStatus('ready');

        const resize = () => {
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          runtimeRenderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };

        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        const clock = new THREE.Clock();
        const animate = () => {
          if (disposed) return;
          const delta = Math.min(clock.getDelta(), 0.05);
          rendererAdapter.update(delta);
          runtimeRenderer.render(scene, camera);
          animationFrame = window.requestAnimationFrame(animate);
        };
        animationFrame = window.requestAnimationFrame(animate);
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : 'Unable to load the VRM avatar.';
        console.error('VRM avatar renderer failed:', error);
        setErrorMessage(message);
        setStatus('error');
      }
    };

    void mount();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      controllerDetach?.();
      resizeObserver?.disconnect();
      rendererAdapter.reset();
      rendererRef.current = null;

      if (glassesGroup) {
        glassesGroup.traverse((object: any) => {
          object.geometry?.dispose?.();
          object.material?.dispose?.();
        });
        glassesGroup.parent?.remove(glassesGroup);
      }

      if (currentVrm?.scene) {
        try {
          currentVrm.scene.traverse((object: any) => {
            object.geometry?.dispose?.();
            const material = object.material;
            if (Array.isArray(material)) material.forEach((item) => item?.dispose?.());
            else material?.dispose?.();
          });
        } catch (cleanupError) {
          console.warn('VRM cleanup failed:', cleanupError);
        }
      }

      runtimeRenderer?.dispose?.();
      runtimeRenderer?.domElement?.remove?.();
    };
  }, [source, alt, animationController]);

  useEffect(() => {
    rendererRef.current?.setState(state);
  }, [state]);

  return (
    <div ref={hostRef} className="relative h-full w-full overflow-hidden" data-vrm-status={status}>
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/15 text-center text-sm text-amber-100/75 backdrop-blur-[1px]">
          در حال بارگذاری آواتار سه‌بعدی…
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-5 text-center">
          <div className="max-w-sm">
            {fallbackSource ? <img src={fallbackSource} alt={alt} className="mx-auto mb-3 max-h-64 w-full object-contain" /> : null}
            <p className="text-sm text-amber-100/80">نمایش آواتار سه‌بعدی انجام نشد.</p>
            <p className="mt-1 break-words text-xs text-amber-100/45">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
