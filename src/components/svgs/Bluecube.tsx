import type { SVGProps } from 'react';
const SvgBluecube = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" {...props}>
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={4}>
      <path stroke="currentColor" d="m32 9 20 10-20 10-20-10Z" />
      <path stroke="currentColor" d="M12 19v24l20 12V29Z" />
      <path stroke="#0EA5E9" d="M52 19v24L32 55V29Z" />
    </g>
  </svg>
);
export default SvgBluecube;
