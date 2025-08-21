import Layout from "@/components/seller/Layout";
import { essentialsOnLoad } from "@/lib/ssrHelper";

export async function getServerSideProps(context) {
  const essentials = await essentialsOnLoad(context);

  if (
    !essentials.props.initialUserData ||
    essentials.props.initialUserData.is_admin === false
  ) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: { ...essentials.props } };
}

export default function SellerDashboard(props) {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Seller Dashboard</h1>
      <p>Welcome back, {props.initialUserData?.name || "Seller"} 👋</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl shadow bg-white">📦 Orders Overview</div>
        <div className="p-4 rounded-xl shadow bg-white">
          🛒 Products Overview
        </div>
        <div className="p-4 rounded-xl shadow bg-white">
          💰 Revenue Overview
        </div>
      </div>
    </Layout>
  );
}
