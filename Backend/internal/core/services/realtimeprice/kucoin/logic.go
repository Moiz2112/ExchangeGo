package kucoin

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore" 
    "strconv"
)

type newKucoinService struct {
	priceRepo        ports.PriceRepository
	broadcastHandler ports.BroadCastHandler
	data             domain.Response
	publisher        ports.Publisher
}

func NewKucoinService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newKucoinService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (kucoin *newKucoinService) GetThePrice() {
	kucoin.data = kucoin.priceRepo.Get(consts.KUCOIN)
	 for _, currency := range kucoin.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.KUCOIN), currency.Name, price)
        }
    }
	kucoin.BroadCast()
	kucoin.WriteToQue()
}

func (kucoin *newKucoinService) BroadCast() {
	kucoin.broadcastHandler.BroadCast(kucoin.data)
}

func (kucoin *newKucoinService) WriteToQue() {
	kucoin.publisher.Publish(kucoin.data)
}
