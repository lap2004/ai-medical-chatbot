import {
  getAllUser,
  createUser,
  updateUserById,
  deleteUserById,
} from "../apis/user";

import { useGetAPI, usePostAPI, usePutAPI, useDeleteAPI } from "./hookApi";

const useGetAllUser = () => {
  const {
    loading,
    get: getGetAllUser,
    error,
    setError,
  } = useGetAPI(getAllUser);

  return {
    loading,
    getGetAllUser,
    error,
    setError,
  };
};

const useCreateUser = () => {
  const {
    loading,
    post: postCreateUser,
    error,
    setError,
  } = usePostAPI(createUser);

  return {
    loading,
    postCreateUser,
    error,
    setError,
  };
};

const useUpdateUser = () => {
  const {
    loading,
    put: putUpdateUser,
    error,
    setError,
  } = usePutAPI(updateUserById);

  return {
    loading,
    putUpdateUser,
    error,
    setError,
  };
};

const useDeleteUser = () => {
  const {
    loading,
    deleteItem: deleteUser,
    error,
    setError,
  } = useDeleteAPI(deleteUserById);

  return {
    loading,
    deleteUser,
    error,
    setError,
  };
};
export { useGetAllUser, useCreateUser, useUpdateUser, useDeleteUser };
