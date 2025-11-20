import "./Shop.css";
import boostImg from "../assets/boost.png";
import cuponImg from "../assets/cupon.png";
import coinsImg from "../assets/coins.png";

export default function Shop() {
  return (
    <div className="shop-container">
      <h1 className="shop-title">MOTIV8</h1>
      <h3 className="shop-subtitle">Tienda</h3>

      {/* El scroll estará solo aquí */}
      <div className="shop-grid">
        <div className="card-shop">
          <img src={boostImg} className="card-img" alt="Boost x1.5" />
          <div className="card-body">
            <h5 className="card-title">Boost x1.5 de XP</h5>
            <p className="card-description">
              Recibes un boost X1.5 de experiencia durante 15min.
            </p>
            <button className="btn-comprar">Comprar</button>
          </div>
        </div>

        <div className="card-shop">
          <img src={cuponImg} className="card-img" alt="Cupón de descuento" />
          <div className="card-body">
            <h5 className="card-title">Cupón de descuento</h5>
            <p className="card-description">
              Recibes un cupón de descuento del 10% en tu próxima compra.
            </p>
            <button className="btn-comprar">Comprar</button>
          </div>
        </div>

        <div className="card-shop">
          <img src={cuponImg} className="card-img" alt="Cupón de descuento" />
          <div className="card-body">
            <h5 className="card-title">Cupón de descuento</h5>
            <p className="card-description">
              Recibes un cupón de descuento del 20% en tu próxima compra.
            </p>
            <button className="btn-comprar">Comprar</button>
          </div>
        </div>

        <div className="card-shop">
          <img src={coinsImg} className="card-img" alt="Multiplicador de Monedas" />
          <div className="card-body">
            <h5 className="card-title">Multiplicador de Monedas</h5>
            <p className="card-description">
              Recibes un multiplicador X1.5 de monedas durante 10min.
            </p>
            <button className="btn-comprar">Comprar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
