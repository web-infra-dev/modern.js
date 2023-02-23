import { useNavigate, Outlet } from '@modern-js/runtime/router';

export default function Page() {
  const nav = useNavigate();
  return (
    <div>
      User page
      <button
        onClick={() => {
          nav('/user/1');
        }}
      >
        go user/1
      </button>
      <Outlet />
    </div>
  );
}
