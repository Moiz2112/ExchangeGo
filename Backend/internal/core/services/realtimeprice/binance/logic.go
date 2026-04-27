package binance

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore"  
    "strconv"
)

type newBinanceService struct {
	priceRepo        ports.PriceRepository
	data             domain.Response
	broadcastHandler ports.BroadCastHandler
	publisher        ports.Publisher
}

func NewBinanceService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newBinanceService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (binance *newBinanceService) GetThePrice() {
	binance.data = binance.priceRepo.Get(consts.BINANCE)
	  for _, currency := range binance.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.BINANCE), currency.Name, price)
        }
    }
	binance.BroadCast()
	binance.WriteToQue()
}

func (binance *newBinanceService) BroadCast() {
	binance.broadcastHandler.BroadCast(binance.data)
}

func (binance *newBinanceService) WriteToQue() {
	binance.publisher.Publish(binance.data)
}
