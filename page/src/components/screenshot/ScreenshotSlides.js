import { centered } from "../home/Carousel.js";

export const slides = [
  {
    name: "/BeautyScreenshotSlide1",
    widths: [900, 1920],
    width: 1920,
    height: 1080,
    pose: centered(0.9, 1920, 1080),
    alt: {
      es: "Beauty Screenshot seleccionando un área de la pantalla, con su medida en píxeles",
      en: "Beauty Screenshot selecting an area of the screen, with its size in pixels",
    },
  },
  {
    name: "/BeautyScreenshotSlide2",
    widths: [900, 1920],
    width: 1920,
    height: 1080,
    pose: centered(0.9, 1920, 1080),
    alt: {
      es: "La captura recién hecha, como miniatura en la esquina de la pantalla",
      en: "The capture just taken, as a thumbnail in the corner of the screen",
    },
  },
  {
    name: "/BeautyScreenshotSlide3",
    widths: [818],
    width: 818,
    height: 538,
    pose: centered(0.78, 818, 538),
    alt: {
      es: "El instalador de Beauty Screenshot: para tu usuario, sin permisos de administrador",
      en: "The Beauty Screenshot installer: for your user, no admin rights needed",
    },
  },
];
