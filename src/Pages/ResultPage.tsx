import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMediaQuery } from "react-responsive";
import Marquee from "react-fast-marquee";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const decodeUnicode = (str: string) => {
  return str.replace(/\\u[\dA-F]{4}/gi, (match) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ""), 16));
  });
};

const ResultPage: React.FC = () => {
  const location = useLocation();
  const { taskId, fileName } = location.state || {};
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [overlayDescription, setOverlayDescription] = useState<string | null>(
    null
  );
  const [overlayLink, setOverlayLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const nameRefs = useRef<HTMLDivElement[]>([]);
  const singerRefs = useRef<HTMLDivElement[]>([]);
  const recommendationBoxRef = useRef<HTMLDivElement>(null);
  const [overflowStates, setOverflowStates] = useState<{
    name: boolean[];
    singer: boolean[];
  }>({ name: [], singer: [] });

  const checkOverflow = (element: HTMLElement | null) => {
    if (element) {
      return element.scrollWidth > element.clientWidth;
    }
    return false;
  };

  useLayoutEffect(() => {
    const nameOverflow = nameRefs.current.map(checkOverflow);
    const singerOverflow = singerRefs.current.map(checkOverflow);
    setOverflowStates({ name: nameOverflow, singer: singerOverflow });
  }, [searchResult]);

  useEffect(() => {
    if (!taskId) {
      setError("Task ID가 제공되지 않았습니다.");
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const response = await axios.get(
          `https://ajtksbackend.p-e.kr/task/${taskId}`
        );
        const data = response.data;

        if (!data || !data.searchResult) {
          setError("결과 데이터가 없습니다.");
          setLoading(false);
          return;
        }

        const decodedResult = data.searchResult.map((result: any) => ({
          ...result,
          musicName: decodeUnicode(result.musicName),
          singer: decodeUnicode(result.singer),
          albumArt: result.albumArt
            ? `https://ajtksbackend.p-e.kr/${result.albumArt}`
            : null,
          link: result.link,
        }));

        setSearchResult(decodedResult);
        setRecommendation(decodeUnicode(data.recommendation));
      } catch (error) {
        console.error("Error fetching task status:", error);
        setError("결과를 가져오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [taskId]);

  const handleAlbumClick = (description: string, link: string) => {
    setOverlayDescription(description);
    setOverlayLink(link);
    if (recommendationBoxRef.current) {
      recommendationBoxRef.current.scrollTop = 0;
      recommendationBoxRef.current.style.overflow = "hidden";
    }
  };

  const handleOverlayClose = () => {
    setOverlayDescription(null);
    setOverlayLink(null);
    if (recommendationBoxRef.current) {
      recommendationBoxRef.current.style.overflow = "auto";
    }
  };

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <img className="w-auto h-40 animate-pulse" src="Group 1.svg" alt="" />
        <div
          className="text-center text-black text-2xl font-normal mb-4"
          style={{ fontFamily: "Inter" }}
        >
          분석 중입니다...
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <div className="bg-white p-4 rounded shadow-lg text-center">
          <p className="mb-4">{error}</p>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded"
            onClick={() => navigate("/")}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden w-full min-h-screen flex flex-col items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url("Desktop - 9.svg")' }}
    >
      <div className="relative w-full max-w-4xl px-4 text-center mt-10">
        <button
          className="absolute right-0 transform -translate-y-full bg-blue-800 text-white text-base font-bold px-4 py-2 rounded-full transition duration-200 ease-in-out hover:bg-blue-700 active:bg-blue-900 active:scale-95"
          style={{ right: "2rem", top: "0" }}
          onClick={() => navigate("/")}
        >
          다시 인식하기
        </button>
        <div className="relative z-10 text-gray-800 text-xl md:text-2xl font-bold mt-4">
          추천 음악 목록
        </div>
        {fileName && (
          <div className="text-gray-800 text-sm md:text-base mt-2">
            입력 파일명: {fileName}
          </div>
        )}
      </div>
      <div
        className={`relative z-10 mt-4 ${
          isMobile
            ? "w-full flex overflow-x-auto space-x-4 px-4"
            : "w-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-center"
        }`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {searchResult.map((result, index) =>
          index === 0 ? null : (
            <motion.div
              key={index}
              className="relative w-[220px] h-[320px] rounded-tl-[38px] overflow-hidden bg-white bg-opacity-60 shadow-md border border-white backdrop-blur-md flex-shrink-0 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleAlbumClick(result.description, result.link)}
            >
              <div className="w-full h-[200px] bg-gray-300">
                {result.albumArt ? (
                  <img
                    className="w-full h-full object-cover"
                    src={result.albumArt}
                    alt={`Album art for ${result.musicName}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-2 flex flex-col justify-between h-[120px]">
                <div
                  ref={(el) => (nameRefs.current[index] = el as HTMLDivElement)}
                  className={`relative ${
                    overflowStates.name[index] ? "flex overflow-x-hidden" : ""
                  }`}
                >
                  {result.musicName.length >= 10 ? (
                    <Marquee>
                      <span className="text-black text-lg font-bold mx-4">
                        {result.musicName}
                      </span>
                    </Marquee>
                  ) : (
                    <span className="text-black text-lg font-bold mx-4">
                      {result.musicName}
                    </span>
                  )}
                </div>
                <div
                  ref={(el) =>
                    (singerRefs.current[index] = el as HTMLDivElement)
                  }
                  className={`relative ${
                    overflowStates.singer[index] ? "flex overflow-x-hidden" : ""
                  }`}
                >
                  <div
                    className={`${
                      overflowStates.singer[index]
                        ? "animate-marquee whitespace-nowrap"
                        : "truncate"
                    }`}
                  >
                    <span className="text-gray-700 text-sm mx-4">
                      {result.singer}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}
      </div>
      <div className="relative z-10 mt-10 w-full max-w-4xl px-4">
        <div className="flex justify-between items-center">
          <div
            className="inline-block bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-full"
            style={{ fontFamily: "Inter" }}
          >
            Music Description by MU-LLaMA
          </div>
          <AnimatePresence>
            {overlayLink && (
              <motion.a
                href={overlayLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-800 text-sm font-bold px-4 py-2 rounded-full transition duration-200 ease-in-out hover:bg-gray-200 active:bg-gray-300 active:scale-95 flex items-center space-x-2"
                style={{ height: "2rem" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <img
                  src="YouTube_full-color_icon_(2017).svg"
                  alt="YouTube"
                  className="w-6 h-6"
                />
                <span>YouTube</span>
              </motion.a>
            )}
          </AnimatePresence>
        </div>
        <div
          className="mt-4 bg-gray-800 bg-opacity-80 text-white text-base font-normal px-6 py-4 rounded-lg relative overflow-y-auto"
          ref={recommendationBoxRef}
          style={{ fontFamily: "Inter", maxHeight: "200px" }}
        >
          <ReactMarkdown className="whitespace-pre-line">
            {recommendation}
          </ReactMarkdown>
          <AnimatePresence>
            {overlayDescription && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white text-black text-base font-normal px-6 py-4 rounded-lg shadow-lg flex flex-col overflow-y-auto"
                style={{ maxHeight: "200px" }}
              >
                <div className="flex justify-between items-start">
                  <ReactMarkdown className="whitespace-pre-line">
                    {overlayDescription}
                  </ReactMarkdown>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={handleOverlayClose}
                  >
                    X
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
