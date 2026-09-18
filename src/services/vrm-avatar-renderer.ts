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
  private entranceRemaining = 1.6;
  private entranceStartX = 2.2;

  setVrm(vrm: any): void {
    this.vrm = vrm;
    this.entranceRemaining = 1.6;
    this.vrm.scene.position.x = this.entranceStartX;
    this.applyExpressions();
    this.applyArmPose(0);
    this.applyWalkPose(0);
    this.applyWalkSway(0);
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
    this.entranceRemaining = 1.6;
    this.blinkRemaining = 0;
    this.greetingRemaining = 0;
    this.greetingTriggered = false;
    this.applyExpressions();
    this.applyArmPose(0);
    this.applyWalkSway(0);
  }

  update(delta: number): void {
    if (!this.vrm) return;

    this.elapsed += delta;
    this.updateBlink(delta);
    this.updateEntrance(delta);
    this.updateGreeting(delta);
    this.updateMotion();
    this.vrm.update?.(delta);
  }

  private updateEntrance(delta: number): void {
    if (this.entranceRemaining <= 0) {
      this.applyWalkPose(0);
      this.applyWalkSway(0);
      return;
    }

    this.entranceRemaining = Math.max(0, this.entranceRemaining - delta);
    const progress = 1 - this.entranceRemaining / 1.6;
    const eased = progress * progress * (3 - 2 * progress);
    this.vrm.scene.position.x = this.entranceStartX * (1 - eased);
    const stride = Math.sin(progress * Math.PI * 6) * (1 - eased * 0.75);
    this.applyWalkPose(stride);
    this.applyWalkSway(stride);
  }

  private applyWalkPose(stride: number): void {
    const humanoid = this.vrm?.humanoid;
    if (!humanoid?.getNormalizedBoneNode) return;

    const leftUpperLeg = humanoid.getNormalizedBoneNode('leftUpperLeg');
    const rightUpperLeg = humanoid.getNormalizedBoneNode('rightUpperLeg');
    const leftLowerLeg = humanoid.getNormalizedBoneNode('leftLowerLeg');
    const rightLowerLeg = humanoid.getNormalizedBoneNode('rightLowerLeg');

    if (leftUpperLeg) leftUpperLeg.rotation.x = stride * 0.55;
    if (rightUpperLeg) rightUpperLeg.rotation.x = -stride * 0.55;
    if (leftLowerLeg) leftLowerLeg.rotation.x = Math.max(0, -stride) * 0.72;
    if (rightLowerLeg) rightLowerLeg.rotation.x = Math.max(0, stride) * 0.72;
  }

  private applyWalkSway(stride: number): void {
    const humanoid = this.vrm?.humanoid;
    if (!humanoid?.getNormalizedBoneNode) return;
    const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
    const hips = humanoid.getNormalizedBoneNode('hips');
    if (leftUpperArm) leftUpperArm.rotation.x = -stride * 0.18;
    if (rightUpperArm) rightUpperArm.rotation.x = stride * 0.18;
    if (hips) hips.rotation.z = stride * 0.018;
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

    // VRM avatars commonly arrive in a T-pose. This VRM's arm rotation axis
    // needs the opposite sign to bring both upper arms down beside the torso.
    // Keep the same rotation magnitude, then briefly reverse the right-arm
    // rotation toward the face for the greeting gesture before returning it down.
    if (leftUpperArm) leftUpperArm.rotation.z = -1.18;
    if (rightUpperArm) rightUpperArm.rotation.z = 1.18 - 0.82 * greeting;
    if (leftLowerArm) leftLowerArm.rotation.z = 0;
    if (rightLowerArm) rightLowerArm.rotation.z = 1.35 * greeting;
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
