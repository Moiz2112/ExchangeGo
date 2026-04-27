package huobi

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore"  // ADD THIS
    "strconv" 
)

type newHuobiService struct {
	priceRepo        ports.PriceRepository
	broadcastHandler ports.BroadCastHandler
	data             domain.Response
	publisher        ports.Publisher
}

func NewHuobiService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newHuobiService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (huobi *newHuobiService) GetThePrice() {
	huobi.data = huobi.priceRepo.Get(consts.HUOBI)
	for _, currency := range huobi.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.HUOBI), currency.Name, price)
        }
    }

	huobi.BroadCast()
	huobi.WriteToQue()
}

func (huobi *newHuobiService) BroadCast() {
	huobi.broadcastHandler.BroadCast(huobi.data)
}

func (huobi *newHuobiService) WriteToQue() {
	huobi.publisher.Publish(huobi.data)
}
