import type { Reward } from '../../types';
import balloonUrl from '../../assets/rewards/reward-balloon.png';
import cloudUrl from '../../assets/rewards/reward-cloud.png';
import birdUrl from '../../assets/rewards/reward-bird.png';
import trophyUrl from '../../assets/rewards/reward-trophy.png';

const rewards: Record<Reward, { image: string; title: string }> = {
  Balloon: { image: balloonUrl, title: 'Воздушный шар' },
  Cloud: { image: cloudUrl, title: 'Облако' },
  Bird: { image: birdUrl, title: 'Птица' },
  Trophy: { image: trophyUrl, title: 'Кубок' },
};

export function RewardCard({ reward }: { reward: Reward }) {
  const item = rewards[reward];
  return (
    <div className="reward-card">
      <img className="reward-icon" src={item.image} alt="" width={72} height={72} />
      <div className="reward-copy">
        <span className="eyebrow">Дополнительная награда</span>
        <h2>{item.title}</h2>
        <p>Ваш сувенир за этот полёт</p>
      </div>
    </div>
  );
}
