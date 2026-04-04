from pydantic import BaseModel


class ClusterBase(BaseModel):
    name: str
    description: str
    descriptionPt: str
    cpuUsage: int = 0
    gpuUsage: int = 0
    memoryUsage: int = 0
    storageUsage: int = 0
    status: str = "online"


class ClusterCreate(ClusterBase):
    pass


class ClusterUpdate(ClusterBase):
    pass


class ClusterOut(ClusterBase):
    id: str
