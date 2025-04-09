"use client";

import React, { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/js/firebase.js";
import { compactFormat } from "@/lib/format-number";
import { OverviewCard } from "./card";
import * as icons from "./icons";

export function OverviewCardsGroup() {
  const [counts, setCounts] = useState({
    admins: 0,
    artisans: 0,
    products: 0,
    orders: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [adminsSnap, artisansSnap, productsSnap, ordersSnap] =
          await Promise.all([
            getCountFromServer(collection(db, "admins")),
            getCountFromServer(collection(db, "artisans")),
            getCountFromServer(collection(db, "products")),
            getCountFromServer(collection(db, "orders")),
          ]);

        setCounts({
          admins: adminsSnap.data().count,
          artisans: artisansSnap.data().count,
          products: productsSnap.data().count,
          orders: ordersSnap.data().count,
        });
      } catch (err) {
        console.error("Error fetching document counts:", err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Admin Count"
        data={{
          value: compactFormat(counts.admins),
        }}
        Icon={icons.Views}
      />
      <OverviewCard
        label="Artisan Count"
        data={{
          value: compactFormat(counts.artisans),
        }}
        Icon={icons.Users}
      />
      <OverviewCard
        label="Product Count"
        data={{
          value: compactFormat(counts.products),
        }}
        Icon={icons.Product}
      />
      <OverviewCard
        label="Order Count"
        data={{
          value: compactFormat(counts.orders),
        }}
        Icon={icons.Profit}
      />
    </div>
  );
}
