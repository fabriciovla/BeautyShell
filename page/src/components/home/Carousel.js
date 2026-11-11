export const WIDTHS = [900, 1800, 2700];

const CARD = 3 / 4;

export const STRAIGHT = {
  top: "15%",
  left: "7%",
  width: "112%",
  transform: "none",
  transformOrigin: "0 0",
};

export function centered(share, width, height) {
  const top = (CARD - (share * height) / width) / 2 / CARD;
  return {
    top: `${(top * 100).toFixed(2)}%`,
    left: `${(((1 - share) / 2) * 100).toFixed(2)}%`,
    width: `${share * 100}%`,
    transform: "none",
    transformOrigin: "0 0",
  };
}

export const STEP = 0.7;

export const scrollLength = (slides) => (slides.length > 1 ? `${(slides.length - 1) * STEP * 100}dvh` : "0px");
