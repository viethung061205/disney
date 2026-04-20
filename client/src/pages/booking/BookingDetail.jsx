import { useParams } from "react-router-dom";
import bookingConfig from "../../data/bookingData";
import TicketList from "../../components/TicketList";
import "./BookingDetail.css";

const BookingDetail = () => {
  const { location } = useParams();
  const data = bookingConfig[location];

  if (!data) return <div>Location not found</div>;

  const handleTermsClick = () => {
    alert(`📄 Terms & Conditions:\n\n${data.terms}`);
  };

  return (
    <div className="booking-detail">
      <div className="hero-section">
        <div className="banner-gallery">
          {data.bannerImages.map((img, i) => (
            <img key={i} src={img} alt={`banner-${i}`} />
          ))}
        </div>
      </div>

      <div className="info-container">
        <div className="info-section">
          <h1>{data.name} Ticket</h1>
          <div className="info-row">
            <p>
              📍
              <a
                href={data.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "white", hover: "pointer"}}
              >
                {data.locationText}
              </a>
            </p>
            <p style={{ paddingRight: "150px"}}>
              🕒 {data.time}
            </p>
          </div>
          <p onClick={handleTermsClick} className="terms-link">
            📄 Terms & Conditions
          </p>
        </div>
      </div>

      <TicketList location={location} />

    </div>
  );
};

export default BookingDetail;
