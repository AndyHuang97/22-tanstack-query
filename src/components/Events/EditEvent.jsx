import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import { fetchEvent, queryClient, updateEvent } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ id: params.id, signal }),
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (mutateData) => {
      // data passed to mutate()
      const newEvent = mutateData.event;
      console.log(newEvent);

      // abort ongoing queries with given queryKey
      console.log("start aborting");
      await queryClient.cancelQueries({ queryKey: ["events", params.id] });
      console.log("end aborting");
      const previousEvent = queryClient.getQueryData(["events", params.id]);

      // force explicitly the data before http response is returned
      queryClient.setQueryData(["events", params.id], newEvent);

      // return the context
      return { previousEvent };
    },
    onError: (error, data, context) => {
      // rollback
      queryClient.setQueryData(["events", params.id], context.previousEvent);
      console.error("Update failed:", error);
    },
    onSettled: () => {
      // after either error or success, synchronize state with backend
      queryClient.invalidateQueries(["events", params.id]);
    },
  });

  function handleSubmit(formData) {
    mutate({ id: params.id, event: formData });
    navigate("../");
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isPending) {
    content = (
      <div className='center'>
        <LoadingIndicator />
      </div>
    );
  }

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title='Failed to load event'
          message={error.info?.message || "Please try again later"}
        />
        <div className='form-actions'>
          <Link to='../' className='button'>
            Okay
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to='../' className='button-text'>
          Cancel
        </Link>
        <button type='submit' className='button'>
          Update
        </button>
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}
