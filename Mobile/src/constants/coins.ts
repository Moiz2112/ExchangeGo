export const COIN_META: Record<string, {
  emoji: string; name: string; color: string; bg: string; id: string;
}> = {
  BTC:  { emoji: '₿', name: 'Bitcoin',      color: '#f7931a', bg: 'rgba(247,147,26,0.12)', id: 'bitcoin' },
  ETH:  { emoji: 'Ξ', name: 'Ethereum',     color: '#627eea', bg: 'rgba(98,126,234,0.12)', id: 'ethereum' },
  ADA:  { emoji: '₳', name: 'Cardano',      color: '#3cc8c8', bg: 'rgba(60,200,200,0.12)', id: 'cardano' },
  SOL:  { emoji: '◎', name: 'Solana',       color: '#9945ff', bg: 'rgba(153,69,255,0.12)', id: 'solana' },
  DOGE: { emoji: 'Ð', name: 'Dogecoin',     color: '#c2a633', bg: 'rgba(194,166,51,0.12)', id: 'dogecoin' },
  XRP:  { emoji: '✕', name: 'XRP',          color: '#00aae4', bg: 'rgba(0,170,228,0.12)', id: 'ripple' },
  DOT:  { emoji: '●', name: 'Polkadot',     color: '#e6007a', bg: 'rgba(230,0,122,0.12)', id: 'polkadot' },
  LTC:  { emoji: 'Ł', name: 'Litecoin',     color: '#bebebe', bg: 'rgba(190,190,190,0.12)', id: 'litecoin' },
  BCH:  { emoji: '₿', name: 'Bitcoin Cash', color: '#8dc351', bg: 'rgba(141,195,81,0.12)', id: 'bitcoin-cash' },
  LINK: { emoji: '⬡', name: 'Chainlink',    color: '#2a5ada', bg: 'rgba(42,90,218,0.12)', id: 'chainlink' },
};