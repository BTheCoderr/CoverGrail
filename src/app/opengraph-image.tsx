import {
  renderCoverGrailSocialImage,
  socialContentType,
  socialSize,
} from "./_social-image";

export const alt = "CoverGrail — Before you slab it, scan it";
export const size = socialSize;
export const contentType = socialContentType;

export default function OpenGraphImage() {
  return renderCoverGrailSocialImage();
}
