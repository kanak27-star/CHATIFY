import { useMutation,useQueryClient } from "@tanstack/react-query";
import { signup } from "../lib/api.js";

const useSignUp = () => {
  const queryClient = useQueryClient();

  const {
    mutate,
    isPending,
    error,
  } = useMutation({
    mutationFn: signup,//signup function sends the signup data to your backend.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return {isPending,error,signupMutation:mutate};

}

export default useSignUp;
