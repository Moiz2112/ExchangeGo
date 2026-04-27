package kraken

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore" 
    "strconv"
)

type newKrakenService struct {
	priceRepo        ports.PriceRepository
	broadcastHandler ports.BroadCastHandler
	data             domain.Response
	publisher        ports.Publisher
}

func NewKrakenService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newKrakenService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (kraken *newKrakenService) GetThePrice() {
	kraken.data = kraken.priceRepo.Get(consts.KRAKEN)
	 for _, currency := range kraken.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.KRAKEN), currency.Name, price)
        }
    }
	kraken.BroadCast()
	kraken.WriteToQue()
}

func (kraken *newKrakenService) BroadCast() {
	kraken.broadcastHandler.BroadCast(kraken.data)
}

func (kraken *newKrakenService) WriteToQue() {
	kraken.publisher.Publish(kraken.data)
}
