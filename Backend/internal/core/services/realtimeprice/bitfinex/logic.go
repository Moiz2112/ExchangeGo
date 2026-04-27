package bitfinex

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore"
	"strconv"
)

type newBitfinexService struct {
	priceRepo        ports.PriceRepository
	data             domain.Response
	broadcastHandler ports.BroadCastHandler
	publisher        ports.Publisher
}

func NewBitfinexService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newBitfinexService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (bitfinex *newBitfinexService) GetThePrice() {
	bitfinex.data = bitfinex.priceRepo.Get(consts.BITFINEX)
	 for _, currency := range bitfinex.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.BITFINEX), currency.Name, price)
        }
    }
	bitfinex.BroadCast()
	bitfinex.WriteToQue()
}

func (bitfinex *newBitfinexService) BroadCast() {
	bitfinex.broadcastHandler.BroadCast(bitfinex.data)
}

func (bitfinex *newBitfinexService) WriteToQue() {
	bitfinex.publisher.Publish(bitfinex.data)
}
