import Image from "next/image";
import { useEffect, useRef } from "react";

import { v2 as cloudinary } from "cloudinary";

import { gsap } from "gsap";

const GalleryThumb = ({ data }) => {
  const gridItemRef = useRef(null);

  function handleMouseEnter() {
    changeBgOnHover(data.predominantColor);
    gsap.to(gridItemRef.current, {
      scale: 1.15,
      delay: 0.3,
    });
  }
  function handleMouseLeave() {
    changeBgOnHover("#fff");
    gsap.to(gridItemRef.current, {
      scale: 1,
      delay: 0.3,
    });
  }

  return (
    <div className="gallery-image-wrapper" ref={gridItemRef}>
      <a href="#" className="gallery-image-link">
        <Image
          src={data.url}
          className="gallery-image"
          layout="fill"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </a>
    </div>
  );
};

const changeBgOnHover = (color) => {
  const bodyElement = document.querySelector("body");
  bodyElement.style.background = color;
};

export default function Home({ imagesData }) {
  const imageGridRef = useRef(null);

  useEffect(() => {
    const imageGridDimensions = imageGridRef.current.getBoundingClientRect();

    function handleMouseMove(e) {
      const veiwportWidth = document.documentElement.clientWidth;
      const veiwportHeight = document.documentElement.clientHeight;

      // x(left) and y(top) distance of non-visible portion of image-grid
      const xOffset = Math.abs(imageGridDimensions.left);
      const yOffset = Math.abs(imageGridDimensions.top);

      // percentage of x(left) and y(top) distance of non-visible portion of image-grid
      const xOffsetPercent = (xOffset / imageGridDimensions.width) * 100;
      const yOffsetPercent = (yOffset / imageGridDimensions.height) * 100;

      // distance to transform x and y of image grid based on mouse move within viewport
      const xTransform = gsap.utils.mapRange(
        0,
        veiwportWidth,
        -xOffsetPercent,
        xOffsetPercent,
        e.clientX
      );
      const yTransform = gsap.utils.mapRange(
        0,
        veiwportHeight,
        -yOffsetPercent,
        yOffsetPercent,
        e.clientY
      );

      gsap.to(imageGridRef.current, {
        xPercent: -xTransform,
        yPercent: -yTransform,
        ease: "expo.out",
        duration: 2.5,
      });
    }

    document
      .querySelector("body")
      .addEventListener("mousemove", handleMouseMove);

    return () =>
      document
        .querySelector("body")
        .removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="gallery-wrapper">
      <h1 className="gallery-title">gallery</h1>
      <div className="gallery-grid-wrapper">
        <div className="gallery-image-grid" ref={imageGridRef}>
          {imagesData.map((image, i) => (
            <GalleryThumb data={image} key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  // get 20 images from a folder in cloudinary account
  const images = await cloudinary.api.resources({
    type: "upload",
    prefix: "cool-panable-image-gallery",
    max_results: 20,
  });

  // get transformed and optimized image urls with predominant color
  const resourcesWithColorInfo = await Promise.all(
    images.resources.map(async (image) => {
      // get image data with color info using cloudinary admin API
      const imageWithColorInfo = await cloudinary.api.resource(
        image.public_id,
        { colors: true }
      );

      // get optimized and resized image url from public ID
      const url = cloudinary.url(imageWithColorInfo.public_id, {
        width: 640,
        quality: "auto:low",
      });

      // return only relevant data - image url, predominant color
      const relevantImageData = {
        url,
        predominantColor: imageWithColorInfo.colors[0][0],
      };
      return relevantImageData;
    })
  );

  return {
    props: {
      imagesData: resourcesWithColorInfo,
    },
  };
}
