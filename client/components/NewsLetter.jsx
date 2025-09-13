import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import SuccessModal from "./SuccessModal"; // import your modal

const NewsLetter = ({ EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY }) => {
  const form = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        form.current,
        EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setModalMessage("Thanks! We'll reach you within 24 hrs.");
          setModalOpen(true);
        },
        () => {
          setModalMessage("Something went wrong. Please try again!");
          setModalOpen(true);
        }
      );
  };

  return (
    <>
      <form
        ref={form}
        onSubmit={sendEmail}
        className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14"
      >
        <h1 className="md:text-4xl text-2xl font-medium">
          Connect Us To Become Seller At CartKoro
        </h1>
        <p className="md:text-base text-gray-500/80 ">
          Put your mail here, we will reach you within 24 hrs.
        </p>
        <p className="md:text-base text-gray-500/80 pb-8">
          Grow Your buisness 10X
        </p>

        <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
          <input
            className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500"
            type="email"
            name="user_email"
            placeholder="Enter your email id"
            required
          />
          <button
            type="submit"
            className="md:px-12 px-8 h-full text-white bg-orange-600 rounded-md rounded-l-none cursor-pointer"
          >
            Connect
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <SuccessModal
        open={modalOpen}
        message={modalMessage}
        onOK={() => {
          setModalOpen(false);
          form.current?.reset();
        }}
      />
    </>
  );
};

export default NewsLetter;
