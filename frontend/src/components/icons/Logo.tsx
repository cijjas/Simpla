export default function Logo({
  className,
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width='100'
      height='100'
      viewBox='0 0 515 511'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M0 511V476.959C25.6717 471.325 39.6555 450.353 43.4384 440.571L257.109 0C323.245 135.249 458.882 412.713 472.344 440.571C485.806 468.43 506.391 476.438 515 476.959V511H367.466V476.959C401.59 476.959 399.164 452.701 393.685 440.571L257.109 154.943C217.453 237.241 134.62 409.583 120.532 440.571C106.444 471.56 132.402 477.742 147.143 476.959V511H0Z'
        fill={color}
      />
    </svg>
  );
}
