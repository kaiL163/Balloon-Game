import type { Reward } from '../../types';
const rewards: Record<Reward, { icon: string; title: string }> = {
  Balloon: { icon: '🎈', title: 'Воздушный шар' }, Cloud: { icon: '☁️', title: 'Облако' },
  Bird: { icon: '🕊️', title: 'Птица' }, Trophy: { icon: '🏆', title: 'Кубок' },
};
export function RewardCard({ reward }: { reward: Reward }) {
  const item = rewards[reward];
  return <div className="reward-card"><span className="reward-icon" aria-hidden="true">{item.icon}</span><div><span className="eyebrow">Дополнительная награда</span><h2>{item.title} <small>{reward}</small></h2><p>Ваш сувенир за этот полёт</p></div></div>;
}
