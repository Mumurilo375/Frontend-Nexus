import { useNavigate } from "react-router-dom";

export default function Back() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <button
      type="button"
      className="flex m-auto w-20 justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-gray-600 mt-10"
      onClick={handleBack}
    >
      Voltar
    </button>
  );
}
