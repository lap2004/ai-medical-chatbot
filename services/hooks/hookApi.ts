import { useCallback, useState } from "react";

type ActionPostType = (options?: any) => Promise<any>;
type ActionPutType = (params?: any) => Promise<any>;
type ActionDeleteType = (option?: any) => Promise<any>;

const usePostAPI = (action: ActionPostType) => {
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const post = useCallback(
    async (body: any) => {
      try {
        setLoading(true);
        const res = await action(body);

        if (res.status === 200) {
          return res;
        } else {
          setError(res?.data?.message || "Lỗi không xác định");
          return undefined;
        }
      } catch (err: any) {
        console.log("Post API error:", err);
        setError(
          err?.response?.data?.detail || err.message || "Lỗi không xác định"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );

  return {
    loading,
    post,
    error,
    setError,
  };
};

const useGetAPI = (action: any) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);

  const get = useCallback(
    async ({ searchOption, pagination }: any) => {
      try {
        setLoading(true);
        setError(null);
        let res = null;
        res = await action({ ...searchOption, ...pagination });
        if (res) {
          return res.data;
        }
        handleError(res?.data?.errors, setError);
        return undefined;
      } catch (errorAPI: any) {
        setError(errorAPI);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [action, setLoading]
  );
  return { loading, get, error, setError };
};

const usePutAPI = (action: ActionPutType) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const put = useCallback(
    async (body: any) => {
      try {
        setLoading(true);
        const res = await action(body);

        if (res.status === 200) {
          return res.data;
        }
        return undefined;
      } catch (error: any) {
        console.log("error", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [action]
  );
  return {
    loading,
    put,
    error,
    setError,
  };
};

const usePutAPIById = (action: ActionPutType) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const put = useCallback(
    async (param: any) => {
      try {
        setLoading(true);
        setError(null);

        const { data, errors, message, statusCode } = await action({
          ...param,
        });

        if (statusCode === 200) {
          return data || {};
        }

        setError(message?.content);
        handleError(errors, setError);
        return undefined;
      } catch (errorAPI: any) {
        const {
          response: {
            data: { error, detail },
          },
        } = errorAPI || {
          response: { data: { error: "", detail: "", message: "" } },
        };

        if (error) {
          setError(detail);
        }
        setError(errorAPI);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );
  return {
    loading,
    put,
    error,
    setError,
  };
};

const useDeleteAPI = (action: ActionDeleteType) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteItem = useCallback(
    async (params: any) => {
      try {
        setLoading(true);
        setError(null);

        const res = await action(params);

        if (res.status === 200) {
          return res.data || {};
        }

        setError(res.message?.content);
        handleError(res.errors, setError);
        return undefined;
      } catch (errorAPI: any) {
        const {
          response: {
            data: { error, detail },
          },
        } = errorAPI || {
          response: { data: { error: "", detail: "", message: "" } },
        };

        if (error) {
          setError(detail);
        }
        setError(errorAPI);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );

  return {
    loading,
    deleteItem,
    error,
    setError,
  };
};

const handleError = (errors: any, setError: any) => {
  if (Array.isArray(errors) && errors.length > 0) {
    setError(errors[0]);
  } else {
    setError(new Error("Something went wrong"));
  }
};

export { useGetAPI, usePostAPI, usePutAPI, usePutAPIById, useDeleteAPI };
