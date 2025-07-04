"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidGameDate } from "@/utils/utils";

export default function useDateIsValid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const today = dateParam || new Date().toLocaleDateString("en-CA");
  const progressKey = `progress-${today}`;
  const [dateIsValid, setDateIsValid] = useState(false);

  useEffect(() => {
    if (!dateParam) {
      setDateIsValid(true);
      return;
    }

    if (!isValidGameDate(dateParam)) {
      alert(
        `Invalid date: ${dateParam}. Please select a valid available date.`
      );
      router.push("/");
    } else {
      setDateIsValid(true);
    }
  }, [dateParam, router]);

  return { dateIsValid, progressKey, today, dateParam };
}
