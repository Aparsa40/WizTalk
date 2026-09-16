import type { AvatarState } from '../types';
import type { AvatarAnimationAdapter, LipSyncState, MouthShape } from './avatar-animation';

const MOUTH_EXPRESSIONS = ['aa', 'ih', 'ou', 'ee', 'oh'];

/**
 * Translate renderer-neutral lip-sync intent into VRM 1.0 expressions.
 * The coordinator remains renderer-agnostic; this mapping belongs here.
 */
export function mouthShapeToExpressions(shape: MouthShape, amplitude: number): Record<string, number> {
  const strength = Math.min(1, Math.max(0, amplitude));
  const values: Record<string, number> = Object.fromEntries(
    MOUTH_EXPRESSIONS.map((name) => [name, 0]),
  );

  switch (shape) {
    case 'open-small':
      values.ih = 0.28 + strength * 0.22;
      values.ee = 0.16 + strength * 0.16;
      break;
    case 'open-medium':
      values.aa = 0.42 + strength * 0.28;
      values.ih = 0.24 + strength * 0.18;
      values.oh = 0.16 + strength * 0.18;
      break;
    case 'open-large':
      values.aa = 0.68 + strength * 0.32;
      values.oh = 0.24 + strength * 0.28;
      break;
    case 'pursed':
      values.ou = 0.55 + strength * 0.4;
      values.ih = 0.08 + strength * 0.08;
      break;
    case 'smile':
    case 'closed':
    default:
      break;
  }

  return values;
}

/**
 * Renderer adapter for VRM 1.0 models.
 *
 * It consumes only AvatarState + normalized LipSyncState, so the same
 * animation stream can continue to drive the existing 2D renderer and this
 * 3D renderer without coupling VoiceService or LipSyncCoordinator to Three.js.
 */
export class VRMAvatarRenderer implements AvatarAnimationAdapter {
  private vrm: any;
  private state: AvatarState = 'idle';
  private lipSync: LipSyncState = {
    mouthShape: 'closed',
    amplitude: 0,
    timestamp: Date.now(),
  };
  private elapsed = 0;
  private blinkTimer = 2.8;
  private blinkRemaining = 0;
  private greetingRemaining = 0;
  private greetingTriggered = false;

  setVrm(vrm: any): void {
    this.vrm = vrm;
    this.applyExpressions();
    this.applyArmPose(0);
  }

  setState(state: AvatarState): void {
    if (state === 'speaking' && this.state !== 'speaking' && !this.greetingTriggered) {
      // The first spoken response is treated as the character's greeting gesture.
      // A future semantic greeting event can replace this without changing the renderer boundary.
      this.greetingTriggered = true;
      this.greetingRemaining = 1.8;
    }
    this.state = state;
  }

  setLipSync(state: LipSyncState): void {
    this.lipSync = { ...state };
    this.applyExpressions();
  }

  reset(): void {
    this.state = 'idle';
    this.lipSync = {
      mouthShape: 'closed',
      amplitude: 0,
      timestamp: Date.now(),
    };
    this.elapsed = 0;
    this.blinkRemaining = 0;
    this.greetingRemaining = 0;
    this.greetingTriggered = false;
    this.applyExpressions();
    this.applyArmPose(0);
  }

  update(delta: number): void {
    if (!this.vrm) return;

    this.elapsed += delta;
    this.updateBlink(delta);
    this.updateGreeting(delta);
    this.updateMotion();
    this.vrm.update?.(delta);
  }

  private updateGreeting(delta: number): void {
    if (this.greetingRemaining > 0) {
      this.greetingRemaining = Math.max(0, this.greetingRemaining - delta);
      const progress = 1 - this.greetingRemaining / 1.8;
      const wave = progress < 0.35
        ? progress / 0.35
        : progress < 0.72
          ? 1
          : 1 - (progress - 0.72) / 0.28;
      this.applyArmPose(Math.max(0, Math.min(1, wave)));
    } else {
      this.applyArmPose(0);
    }
  }

  private applyArmPose(greeting: number): void {
    const humanoid = this.vrm?.humanoid;
    if (!humanoid?.getNormalizedBoneNode) return;

    const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
    const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
    const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');

    // VRM avatars commonly arrive in a T-pose. Lower both arms into a relaxed
    // neutral pose, then briefly lift the right arm toward the face for greeting.
    if (leftUpperArm) leftUpperArm.rotation.z = 1.18;
    if (rightUpperArm) rightUpperArm.rotation.z = -1.18;
    if (leftLowerArm) leftLowerArm.rotation.z = 0;
    if (rightLowerArm) rightLowerArm.rotation.z = -1.35 * greeting;

    if (rightUpperArm) rightUpperArm.rotation.z = -1.18 + 0.82 * greeting;
  }

  private updateBlink(delta: number): void {
    this.blinkTimer -= delta;
    if (this.blinkTimer <= 0 && this.blinkRemaining <= 0) {
      this.blinkRemaining = 0.12;
      this.blinkTimer = 2.8 + Math.random() * 2.8;
    }

    if (this.blinkRemaining > 0) this.blinkRemaining -= delta;
    const blink = this.blinkRemaining > 0 ? 1 : 0;

    this.vrm.expressionManager?.setValue('blink', blink);
    this.vrm.expressionManager?.setValue('blinkLeft', blink);
    this.vrm.expressionManager?.setValue('blinkRight', blink);
  }

  private updateMotion(): void {
    const head = this.vrm.humanoid?.getNormalizedBoneNode?.('head');
    if (!head) return;

    const idleWave = Math.sin(this.elapsed * 1.7);
    const speakingWave = Math.sin(this.elapsed * 7.5);
    const listeningWave = Math.sin(this.elapsed * 1.3);

    if (this.state === 'speaking') {
      head.rotation.x = speakingWave * 0.018;
      head.rotation.y = Math.sin(this.elapsed * 2.2) * 0.012;
      head.rotation.z = 0;
    } else if (this.state === 'listening') {
      head.rotation.x = listeningWave * 0.012;
      head.rotation.y = listeningWave * 0.025;
      head.rotation.z = 0;
    } else if (this.state === 'thinking') {
      head.rotation.y = Math.sin(this.elapsed * 0.9) * 0.035;
      head.rotation.x = 0.02 + Math.sin(this.elapsed * 0.7) * 0.008;
      head.rotation.z = 0;
    } else if (this.state === 'error') {
      head.rotation.x = 0;
      head.rotation.y = 0;
      head.rotation.z = Math.sin(this.elapsed * 18) * 0.045;
    } else {
      head.rotation.x = idleWave * 0.008;
      head.rotation.y = Math.sin(this.elapsed * 0.8) * 0.012;
      head.rotation.z = 0;
    }
  }

  private applyExpressions(): void {
    const manager = this.vrm?.expressionManager;
    if (!manager) return;

    for (const name of MOUTH_EXPRESSIONS) manager.setValue(name, 0);
    manager.setValue('happy', this.lipSync.mouthShape === 'smile' ? 0.35 : 0);

    const values = mouthShapeToExpressions(
      this.lipSync.mouthShape,
      this.lipSync.amplitude,
    );

    for (const [name, value] of Object.entries(values)) {
      manager.setValue(name, value);
    }

    manager.update?.();
  }
}
