import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import EventItem from "./EventItem.jsx";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../util/http.js";

export default function NewEventsSection() {
  // error refers to the error thrown by queryFn
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events"], // this is the key for the cache used by tanstack query
    queryFn: fetchEvents, // NOTE: by default, react query passes an object with predefined keys
    staleTime: 5000, // default 0, time interval after which to fetch data in a page after switching page and back
    //gcTime: 1000, // default 5 min, how long data is kept in cache
  });

  let content;

  if (isPending) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock
        title='An error occurred'
        message={error.info?.message || "Failed to fetch events."}
      />
    );
  }

  if (data) {
    content = (
      <ul className='events-list'>
        {data.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className='content-section' id='new-events-section'>
      <header>
        <h2>Recently added events</h2>
      </header>
      {content}
    </section>
  );
}
