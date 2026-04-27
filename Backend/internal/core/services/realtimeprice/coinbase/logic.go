package coinbase

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore"  
    "strconv" 
)

type newCoinBaseService struct {
	priceRepo        ports.PriceRepository
	broadcastHandler ports.BroadCastHandler
	data             domain.Response
	publisher        ports.Publisher
}

func NewCoinBaseService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newCoinBaseService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (coinbase *newCoinBaseService) GetThePrice() {
	coinbase.data = coinbase.priceRepo.Get(consts.COINBASE)
	for _, currency := range coinbase.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.COINBASE), currency.Name, price)
        }
    }
	coinbase.BroadCast()
	coinbase.WriteToQue()
}

func (coinbase *newCoinBaseService) BroadCast() {
	coinbase.broadcastHandler.BroadCast(coinbase.data)
}

func (coinbase *newCoinBaseService) WriteToQue() {
	coinbase.publisher.Publish(coinbase.data)
}
