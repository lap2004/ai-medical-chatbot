import { getstats, useTrack } from "../apis/admin";
import { useGetAPI, usePostAPI } from "./hookApi";

const useGetStats = () => {
  const { loading, get: getGetStats, error, setError } = useGetAPI(getstats);
  return {
    loading,
    getGetStats,
    error,
    setError,
  };
};

const useGetTrack = () => {
  const {
    loading,
    post: postUseTrack,
    error,
    setError,
  } = usePostAPI(useTrack);
  return {
    loading,
    postUseTrack,
    error,
    setError,
  };
};

export { useGetStats, useGetTrack};
