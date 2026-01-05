import React from "react";

const TestingPage = () => {
  return (
    <div className="mx-auto mt-42 max-w-7xl">
      <div className="grid h-screen grid-cols-2 gap-4">
        <div className="overflow-y-auto bg-orange-300">konten panjang</div>

        <div className="sticky top-42 h-fit bg-green-500">sidebar</div>
      </div>
    </div>
  );
};

export default TestingPage;
