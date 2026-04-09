/**
 * CloseIcon - yopish (X) SVG ikonkasi
 */
import Svg, { Path } from "react-native-svg";

interface CloseIconProps {
  size?: number;
  color?: string;
}

export function CloseIcon({ size = 28, color = "#fff" }: CloseIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56.326 56.326">
      <Path
        fill={color}
        d="M477.613,422.087l25.6-25.6a1.5,1.5,0,0,0-2.122-2.121l-25.6,25.6-25.6-25.6a1.5,1.5,0,1,0-2.121,2.121l25.6,25.6-25.6,25.6a1.5,1.5,0,0,0,2.121,2.122l25.6-25.6,25.6,25.6a1.5,1.5,0,0,0,2.122-2.122Z"
        transform="translate(-447.328 -393.924)"
      />
    </Svg>
  );
}
