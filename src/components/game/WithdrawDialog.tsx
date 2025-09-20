'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendTelegramMessage } from '@/ai/flows/telegram-flow';


type WithdrawDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentScore: number;
  onWithdrawSuccess: (amount: number) => void;
  userId: string | undefined;
};

const WITHDRAW_AMOUNT = 50000;
const WITHDRAW_COST_DZD = 100;

export const WithdrawDialog: React.FC<WithdrawDialogProps> = ({
  isOpen,
  onOpenChange,
  currentScore,
  onWithdrawSuccess,
  userId
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleWithdraw = async () => {
    const algerianPhoneRegex = /^(05|06|07)\d{8}$/;

    if (!algerianPhoneRegex.test(phoneNumber)) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال رقم هاتف جزائري صحيح (يبدأ بـ 05، 06، أو 07).',
        variant: 'destructive',
      });
      return;
    }

    if (currentScore < WITHDRAW_AMOUNT) {
      toast({
        title: 'خطأ',
        description: `ليس لديك نقاط كافية. أنت بحاجة إلى ${WITHDRAW_AMOUNT.toLocaleString()} نقطة على الأقل.`,
        variant: 'destructive',
      });
      return;
    }

    if (!userId) {
        toast({
            title: 'خطأ',
            description: 'لم يتم العثور على المستخدم. حاول مرة أخرى.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsLoading(true);

    try {
        const message = `
        New withdrawal request from "Skyward Soar"
        ---------------------------------
        👤 User ID: ${userId}
        📱 Phone Number: ${phoneNumber}
        💰 Points to Withdraw: ${WITHDRAW_AMOUNT.toLocaleString()} (${WITHDRAW_COST_DZD} DZD Flexy)
        ---------------------------------
        `;
        
        await sendTelegramMessage(message);

        // On success, deduct points locally and trigger parent callback
        // The parent will handle syncing with Firebase.
        onWithdrawSuccess(WITHDRAW_AMOUNT);
        
        onOpenChange(false);
        setPhoneNumber('');

        toast({
            title: 'نجاح!',
            description: `تم إرسال طلب سحب ${WITHDRAW_COST_DZD} دج فليكسي إلى الرقم ${phoneNumber}.`,
        });

    } catch (error) {
        console.error("Withdrawal error:", error);
        toast({
            title: 'خطأ',
            description: 'فشل إتمام عملية السحب. يرجى المحاولة مرة أخرى.',
            variant: 'destructive'
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>سحب النقاط</DialogTitle>
          <DialogDescription>
            استبدل نقاطك برصيد فليكسي. كل {WITHDRAW_AMOUNT.toLocaleString()} نقطة = {WITHDRAW_COST_DZD} دج فليكسي.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right col-span-1">
              رقم الهاتف
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07/06/05..."
              className="col-span-3"
              onClick={(e) => e.stopPropagation()}
              disabled={isLoading}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            رصيدك الحالي: {currentScore.toLocaleString()} نقطة
          </p>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              handleWithdraw();
            }}
            disabled={currentScore < WITHDRAW_AMOUNT || isLoading}
          >
            {isLoading ? 'جاري الإرسال...' : `سحب ${WITHDRAW_AMOUNT.toLocaleString()} نقطة`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
