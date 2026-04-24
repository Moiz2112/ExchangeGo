package okx

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore"  
    "strconv"
)

type newOkxService struct {
	priceRepo        ports.PriceRepository
	broadcastHandler ports.BroadCastHandler
	data             domain.Response
	publisher        ports.Publisher
}

func NewOkxService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newOkxService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (okx *newOkxService) GetThePrice() {
	okx.data = okx.priceRepo.Get(consts.OKX)
	 for _, currency := range okx.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.OKX), currency.Name, price)
        }
    }
	okx.BroadCast()
	okx.WriteToQue()
}

func (okx *newOkxService) BroadCast() {
	okx.broadcastHandler.BroadCast(okx.data)
}

func (okx *newOkxService) WriteToQue() {
	okx.publisher.Publish(okx.data)
}
