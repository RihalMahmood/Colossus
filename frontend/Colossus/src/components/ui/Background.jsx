import { useTheme } from "../../context/ThemeContext";

export default function Background() {
  const { isDark } = useTheme();

  return (
    <>
      <div
        style={{
          background: isDark
            ? "radial-gradient(140% 140% at 50% 10%, #000 50%, #6633ee 100%)"
            : "radial-gradient(140% 140% at 50% 10%, #fff 50%, #6633ee 100%)",
        }}
        className="fixed inset-0 -z-10 w-full h-full"
      />
      <div className={`fixed inset-0 -z-20 w-full h-full ${isDark ? "bg-black" : "bg-white"}`} />
    </>
  );
}
