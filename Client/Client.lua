local PORT = 3000; --// PORt variable at the end of file in Server/server.js

local AuthKey = "Abc123"


local Encode, Decode
do
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    -- encoding
    Encode = function(data)
        return ((data:gsub('.', function(x) 
            local r,b='',x:byte()
            for i=8,1,-1 do r=r..(b%2^i-b%2^(i-1)>0 and '1' or '0') end
            return r;
        end)..'0000'):gsub('%d%d%d?%d?%d?%d?', function(x)
            if (#x < 6) then return '' end
            local c=0
            for i=1,6 do c=c+(x:sub(i,i)=='1' and 2^(6-i) or 0) end
            return b:sub(c+1,c+1)
        end)..({ '', '==', '=' })[#data%3+1])
    end
end

local Url = "https://example.com:"..PORT --// URL

local HttpService = game:GetService("HttpService")

local GateCount = 50;

local Token = "/auth/key/%s" -- [1 auth key]
local Gate = "/gate/%s/token/%s/key/%s" -- [1 gateId, 2 auth token, 3 auth key]

local function RequestURL(Url, Method)
    return syn.request({Url=Url, Method=Method});
end

local IsActive = RequestURL(Url.."/active", "GET").Body == "active"

if not IsActive then
    return error("Not active.")
end

-- Active only for around 15s
local AuthToken = RequestURL(Url..Token:format(AuthKey), "GET").Headers["ex-auth-token"]


local Whitelisted = false;

for GateId = 1, GateCount do
    local function GetAOB(S)
        local AOB = {}
        for I in S:gmatch('.') do
            AOB[#AOB+1] = tostring(I:byte()..GateId)
        end
        return AOB
    end
    
    local function GetAOBSum(A)
        local Sum = ""
        for I in pairs(A) do
            Sum=Sum..tostring(A[I])
        end
        return Sum
    end

    local AOB, AOB_Sum = GetAOB(Encode(AuthKey)), GetAOBSum(GetAOB(Encode(AuthKey)))
    local GateOut = RequestURL(Url..Gate:format(GateId, AuthToken, AuthKey)) -- [1 gateId, 2 auth token, 3 auth key]
    local exAOB, exSUM = GateOut.Headers['ex-auth-aob'], GateOut.Headers["ex-auth-sum"]
    local jAOB = HttpService:JSONEncode(AOB)

    -- print(exAOB, jAOB, "\n", AOB_Sum, exSUM)
    if exAOB == jAOB and rawequal(exAOB, jAOB) then
        --/ print("Check 1 gate", GateId)
        --/ print(exSUM, type(exSUM), AOB_Sum, type(AOB_Sum))
        if exSUM == AOB_Sum and rawequal(AOB_Sum, exSUM) then
            --/ print("Check 2 gate", GateId)
            if exSUM == jAOB and rawequal(jAOB, exSUM) then
                return print('da fuq')
            end
            if GateId == GateCount and not exSUM ~= AOB_Sum and not exAOB ~= jAOB and not rawequal(exAOB, AOB_Sum) then
                --/ print('hi')
                Whitelisted = true
            end
        end
    end
end

repeat wait() until Whitelisted == true

print("Whitelisted!")
