export function Logo() {
  return (
    <div className="flex items-center pl-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M8 8H24V24H8V8Z"
          className="fill-primary"
        />
        <path
          d="M13 13H19V19H13V13Z"
          className="fill-background"
        />
      </svg>
    </div>
  )
}
