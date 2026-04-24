package gate_io

import (
	"coinstrove/consts"
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/userstore"  
    "strconv"  
)

type newGateIOService struct {
	priceRepo        ports.PriceRepository
	broadcastHandler ports.BroadCastHandler
	data             domain.Response
	publisher        ports.Publisher
}

func NewGateIOService(priceRepo ports.PriceRepository, broadcaster ports.BroadCastHandler, publisher ports.Publisher) ports.PriceService {
	return &newGateIOService{
		priceRepo:        priceRepo,
		broadcastHandler: broadcaster,
		publisher:        publisher,
	}
}

func (gateio *newGateIOService) GetThePrice() {
	gateio.data = gateio.priceRepo.Get(consts.GATEIO)
	 for _, currency := range gateio.data.Data.Currencies {
        if price, err := strconv.ParseFloat(currency.Price, 64); err == nil {
            userstore.GlobalStore.SavePrice(string(consts.GATEIO), currency.Name, price)
        }
    }
	gateio.BroadCast()
	gateio.WriteToQue()
}

func (gateio *newGateIOService) BroadCast() {
	gateio.broadcastHandler.BroadCast(gateio.data)
}

func (gateio *newGateIOService) WriteToQue() {
	gateio.publisher.Publish(gateio.data)
}
