import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/js/firebase.js"; 
import { compactFormat } from "@/lib/format-number";
import { OverviewCard } from "./card";
import * as icons from "./icons";

export async function OverviewCardsGroup() {
  // Fetch data from Firestore
  const statsCollection = collection(db, "stats");
  const snapshot = await getDocs(statsCollection);

  // Assume we're working with only one document.
  const statsDoc = snapshot.docs[0]?.data() || {};

  const { admin_count, artisan_count, order_count, product_count } = statsDoc;

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Admin Count"
        data={{
          value: compactFormat(admin_count || 0),
        }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Artisan Count"
        data={{
          value: compactFormat(artisan_count || 0),
        }}
        Icon={icons.Users}
      />

      <OverviewCard
        label="Order Count"
        data={{
          value: compactFormat(order_count || 0),
        }}
        Icon={icons.Product}
      />

      <OverviewCard
        label="Product Count"
        data={{
          value: compactFormat(product_count || 0),
        }}
        Icon={icons.Profit}
      />
    </div>
  );
}