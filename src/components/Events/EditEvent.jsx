import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { fetchEvent, queryClient, updateEvent } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const submit = useSubmit();
  const params = useParams();

  // with loader there is no need for isPending, page is rendered after data is received
  const { data, isError, error } = useQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ id: params.id, signal }),
    staleTime: 5000, // use cache data (avoid additional http request)
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   onMutate: async (mutateData) => {
  //     // data passed to mutate()
  //     const newEvent = mutateData.event;
  //     console.log(newEvent);

  //     // abort ongoing queries with given queryKey
  //     console.log("start aborting");
  //     await queryClient.cancelQueries({ queryKey: ["events", params.id] });
  //     console.log("end aborting");
  //     const previousEvent = queryClient.getQueryData(["events", params.id]);

  //     // force explicitly the data before http response is returned
  //     queryClient.setQueryData(["events", params.id], newEvent);

  //     // return the context
  //     return { previousEvent };
  //   },
  //   onError: (error, data, context) => {
  //     // rollback
  //     queryClient.setQueryData(["events", params.id], context.previousEvent);
  //     console.error("Update failed:", error);
  //   },
  //   onSettled: () => {
  //     // after either error or success, synchronize state with backend
  //     queryClient.invalidateQueries(["events", params.id]);
  //   },
  // });

  function handleSubmit(formData) {
    // mutate({ id: params.id, event: formData });
    // navigate("../");

    // any method different from "GET"
    // this method does not trigger an http request, but the action
    submit(formData, { method: "PUT" });
  }

  function handleClose() {
    navigate("../");
  }

  let content;

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
        {state === "submitting" ? (
          <p>Sending data</p>
        ) : (
          <>
            <Link to='../' className='button-text'>
              Cancel
            </Link>
            <button type='submit' className='button'>
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

// Using React Router's loader does not make the useQuery useless
// It's best used in conjunction with useQuery, the loader will put the data in
// cache, and subsequent operations on the page will leverage the cache capabilities
// of Tanstack query
export function loader({ params }) {
  // trigger query programmatically outside React components
  return queryClient.fetchQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ id: params.id, signal }),
  });
}

// form submission for simple cases
export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);

  await updateEvent({ id: params.id, event: updatedEventData });

  // no more optimistic update
  await queryClient.invalidateQueries(["events"]);
  return redirect("../");
}
